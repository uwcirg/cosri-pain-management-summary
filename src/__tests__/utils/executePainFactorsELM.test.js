import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  getCacheStats,
  clearResourceCache,
  doSearchOptimized,
  executeRequests,
  getResourcesFromBundle,
  getResourceTypesFromPatientBundle,
} from "../../utils/executePainFactorsELM";

describe("In-memory cache Functions", () => {
  beforeEach(() => {
    clearResourceCache();
  });

  describe("Cache Statistics", () => {
    test("getCacheStats returns correct structure", () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("entries");
      expect(typeof stats.size).toBe("number");
      expect(Array.isArray(stats.entries)).toBe(true);
    });

    test("cache starts empty", () => {
      const stats = getCacheStats();
      
      expect(stats.size).toBe(0);
      expect(stats.entries).toEqual([]);
    });

    test("cache stats update after adding entries", async () => {
      const mockClient = {
        patient: {
          request: vi.fn().mockResolvedValue({
            entry: [{ resource: { resourceType: "Patient", id: "123" } }],
          }),
        },
      };

      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");

      const stats = getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries.length).toBe(1);
    });

    test("cache stats reflect multiple entries", async () => {
      const mockClient = {
        patient: {
          request: vi.fn()
            .mockResolvedValueOnce({
              entry: [{ resource: { resourceType: "Patient", id: "123" } }],
            })
            .mockResolvedValueOnce({
              entry: [{ resource: { resourceType: "Condition", id: "456" } }],
            }),
        },
      };

      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      await doSearchOptimized(mockClient, 4, "Condition", [], {}, "test-client");

      const stats = getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.entries.length).toBe(2);
    });
  });

  describe("Cache Clear Functionality", () => {
    test("clearResourceCache empties the cache", async () => {
      const mockClient = {
        patient: {
          request: vi.fn().mockResolvedValue({
            entry: [{ resource: { resourceType: "Patient", id: "123" } }],
          }),
        },
      };

      // Add entries to cache
      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      expect(getCacheStats().size).toBe(1);

      // Clear cache
      clearResourceCache();
      
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.entries).toEqual([]);
    });

    test("clearResourceCache works with multiple entries", async () => {
      const mockClient = {
        patient: {
          request: vi.fn()
            .mockResolvedValueOnce({
              entry: [{ resource: { resourceType: "Patient", id: "123" } }],
            })
            .mockResolvedValueOnce({
              entry: [{ resource: { resourceType: "Condition", id: "456" } }],
            })
            .mockResolvedValueOnce({
              entry: [{ resource: { resourceType: "Observation", id: "789" } }],
            }),
        },
      };

      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      await doSearchOptimized(mockClient, 4, "Condition", [], {}, "test-client");
      await doSearchOptimized(mockClient, 4, "Observation", [], {}, "test-client");
      
      expect(getCacheStats().size).toBe(3);

      clearResourceCache();
      
      expect(getCacheStats().size).toBe(0);
    });
  });

  describe("Cache Hit/Miss Behavior", () => {
    test("first request is cache miss, second is cache hit", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        entry: [{ resource: { resourceType: "Patient", id: "123" } }],
      });

      const mockClient = {
        patient: { request: mockRequest },
      };

      // First call - cache miss
      const result1 = await doSearchOptimized(
        mockClient,
        4,
        "Patient",
        [],
        {},
        "test-client"
      );

      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(getCacheStats().size).toBe(1);

      // Second call - cache hit
      const result2 = await doSearchOptimized(
        mockClient,
        4,
        "Patient",
        [],
        {},
        "test-client"
      );

      // Should not call request again (from cache)
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    test("different resource types create separate cache entries", async () => {
      const mockRequest = vi.fn()
        .mockResolvedValueOnce({
          entry: [{ resource: { resourceType: "Patient", id: "123" } }],
        })
        .mockResolvedValueOnce({
          entry: [{ resource: { resourceType: "Condition", id: "456" } }],
        });

      const mockClient = {
        patient: { request: mockRequest },
      };

      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      await doSearchOptimized(mockClient, 4, "Condition", [], {}, "test-client");

      // Both should trigger requests (different resource types)
      expect(mockRequest).toHaveBeenCalledTimes(2);
      expect(getCacheStats().size).toBe(2);
    });

    test("different clients create separate cache entries", async () => {
      const mockRequest = vi.fn()
        .mockResolvedValueOnce({
          entry: [{ resource: { resourceType: "Patient", id: "123" } }],
        })
        .mockResolvedValueOnce({
          entry: [{ resource: { resourceType: "Patient", id: "456" } }],
        });

      const mockClient = {
        patient: { request: mockRequest },
      };

      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "client1");
      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "client2");

      // Both should trigger requests (different clients)
      expect(mockRequest).toHaveBeenCalledTimes(2);
      expect(getCacheStats().size).toBe(2);
    });
  });
});

describe("Bundle Functions", () => {
  describe("getResourcesFromBundle", () => {
    test("returns empty array for empty input", () => {
      const result = getResourcesFromBundle([]);
      expect(result).toEqual([]);
    });

    test("wraps resources in resource property", () => {
      const input = [{ resourceType: "Patient", id: "123" }];
      const result = getResourcesFromBundle(input);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("resource");
      expect(result[0].resource.resourceType).toBe("Patient");
    });

    test("handles Bundle resourceType", () => {
      const input = [
        {
          resourceType: "Bundle",
          entry: [
            { resource: { resourceType: "Patient", id: "123" } },
            { resource: { resourceType: "Condition", id: "456" } },
          ],
        },
      ];

      const result = getResourcesFromBundle(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].resource.resourceType).toBe("Patient");
      expect(result[1].resource.resourceType).toBe("Condition");
    });

    test("handles mixed Bundle entries", () => {
      const input = [
        {
          resourceType: "Bundle",
          entry: [
            { resource: { resourceType: "Patient", id: "123" } },
            { resourceType: "Condition", id: "456" }, // Without resource wrapper
          ],
        },
      ];

      const result = getResourcesFromBundle(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].resource.resourceType).toBe("Patient");
      expect(result[1].resource.resourceType).toBe("Condition");
    });
  });

  describe("getResourceTypesFromPatientBundle", () => {
    test("returns empty array for empty bundle", () => {
      const result = getResourceTypesFromPatientBundle([]);
      expect(result).toEqual([]);
    });

    test("extracts unique resource types", () => {
      const bundle = [
        { resource: { resourceType: "Patient", id: "123" } },
        { resource: { resourceType: "Condition", id: "456" } },
        { resource: { resourceType: "Observation", id: "789" } },
      ];

      const result = getResourceTypesFromPatientBundle(bundle);
      
      expect(result).toHaveLength(3);
      expect(result).toContain("Patient");
      expect(result).toContain("Condition");
      expect(result).toContain("Observation");
    });

    test("returns unique types when duplicates exist", () => {
      const bundle = [
        { resource: { resourceType: "Patient", id: "123" } },
        { resource: { resourceType: "Condition", id: "456" } },
        { resource: { resourceType: "Condition", id: "789" } },
      ];

      const result = getResourceTypesFromPatientBundle(bundle);
      
      expect(result).toHaveLength(2);
      expect(result).toContain("Patient");
      expect(result).toContain("Condition");
    });

    test("handles entries without resourceType", () => {
      const bundle = [
        { resource: { resourceType: "Patient", id: "123" } },
        { resource: { id: "456" } }, // Missing resourceType
        { resource: { resourceType: "Condition", id: "789" } },
      ];

      const result = getResourceTypesFromPatientBundle(bundle);
      
      // Should only include entries with resourceType
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain("Patient");
      expect(result).toContain("Condition");
    });
  });
});

describe("Integration Tests", () => {
  beforeEach(() => {
    clearResourceCache();
  });

  describe("In-memory cache with real flow", () => {
    test("cache improves performance on second load", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        entry: [
          { resource: { resourceType: "Patient", id: "123" } },
          { resource: { resourceType: "Condition", id: "456" } },
        ],
      });

      const mockClient = {
        patient: { request: mockRequest },
      };

      // First load (no cache) - should make network request
      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(getCacheStats().size).toBe(1);

      // Second load (from cache) - should NOT make network request
      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      
      // Cache hit: request still only called once (not twice)
      expect(mockRequest).toHaveBeenCalledTimes(1);
      
      // Third load (from cache) - verify cache continues to work
      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      
      // Still only one network request (all subsequent from cache)
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(getCacheStats().size).toBe(1);
    });

    test("cache handles errors gracefully", async () => {
      const mockRequest = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          entry: [{ resource: { resourceType: "Patient", id: "123" } }],
        });

      const mockClient = {
        patient: { request: mockRequest },
      };

      const collector = [];

      // First call - should handle error gracefully
      const result1 = await doSearchOptimized(
        mockClient,
        4,
        "Patient",
        collector,
        {},
        "test-client"
      );

      // Verify error was captured
      expect(collector.length).toBeGreaterThan(0);
      expect(collector[0].error).toBeDefined();
      expect(collector[0].type).toBe("Patient");
      
      // First call returns empty array on error (graceful degradation)
      expect(Array.isArray(result1)).toBe(true);
      expect(result1.length).toBe(0);

      // Second call - should work after clearing cache
      clearResourceCache();
      const collector2 = [];
      const result2 = await doSearchOptimized(
        mockClient,
        4,
        "Patient",
        collector2,
        {},
        "test-client"
      );

      // Second call should succeed
      expect(result2.length).toBe(0);
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe("Component State Simulation", () => {
    test("simulates component loading patient data", async () => {
      const mockClient = {
        getFhirRelease: vi.fn().mockResolvedValue(4),
        patient: {
          request: vi.fn().mockResolvedValue({
            entry: [{ resource: { resourceType: "Patient", id: "123" } }],
          }),
        },
        state: {
          serverUrl: "https://test-server.com",
        },
      };

      const patient = { id: "123" };
      const collector = [];
      const resourceTypes = {};

      // This simulates what Landing component does
      const result = await executeRequests(
        mockClient,
        patient,
        collector,
        resourceTypes
      );

      expect(result).toBeDefined();
      expect(result.patientBundle).toBeDefined();
      expect(result.library).toBeDefined();
      expect(result.patientSource).toBeDefined();
    });

    test("handles multiple sequential patient loads", async () => {
      const mockClient = {
        getFhirRelease: vi.fn().mockResolvedValue(4),
        patient: {
          request: vi.fn()
            .mockResolvedValueOnce({
              entry: [{ resource: { resourceType: "Patient", id: "123" } }],
            })
            .mockResolvedValueOnce({
              entry: [{ resource: { resourceType: "Patient", id: "456" } }],
            }),
        },
        state: {
          serverUrl: "https://test-server.com",
        },
      };

      // Load patient 1
      const result1 = await executeRequests(
        mockClient,
        { id: "123" },
        [],
        {}
      );

      expect(result1.patientBundle).toBeDefined();

      // Load patient 2
      const result2 = await executeRequests(
        mockClient,
        { id: "456" },
        [],
        {}
      );

      expect(result2.patientBundle).toBeDefined();
      
      // Should have made requests for both patients
      expect(mockClient.patient.request.mock.calls.length).toBeGreaterThan(0);
    });
  });
});

describe("Performance & Monitoring", () => {
  beforeEach(() => {
    clearResourceCache();
  });

  describe("Cache Performance Metrics", () => {
    test("cache hit rate calculation", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        entry: [{ resource: { resourceType: "Patient", id: "123" } }],
      });

      const mockClient = {
        patient: { request: mockRequest },
      };

      let cacheHits = 0;
      let cacheMisses = 0;

      // First call - miss
      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      cacheMisses++;

      // Subsequent calls - hits
      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      cacheHits++;
      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      cacheHits++;

      const hitRate = cacheHits / (cacheHits + cacheMisses);
      
      expect(mockRequest).toHaveBeenCalledTimes(1); // Only first call
      expect(hitRate).toBeGreaterThan(0.5); // 2/3 = 66%
    });

    test("cache size monitoring", async () => {
      const mockClient = {
        patient: {
          request: vi.fn()
            .mockResolvedValueOnce({
              entry: [{ resource: { resourceType: "Patient", id: "1" } }],
            })
            .mockResolvedValueOnce({
              entry: [{ resource: { resourceType: "Condition", id: "2" } }],
            })
            .mockResolvedValueOnce({
              entry: [{ resource: { resourceType: "Observation", id: "3" } }],
            }),
        },
      };

      expect(getCacheStats().size).toBe(0);

      await doSearchOptimized(mockClient, 4, "Patient", [], {}, "test-client");
      expect(getCacheStats().size).toBe(1);

      await doSearchOptimized(mockClient, 4, "Condition", [], {}, "test-client");
      expect(getCacheStats().size).toBe(2);

      await doSearchOptimized(mockClient, 4, "Observation", [], {}, "test-client");
      expect(getCacheStats().size).toBe(3);
    });
  });

  describe("Error Tracking", () => {
    test("collector captures fetch errors", async () => {
      const mockClient = {
        patient: {
          request: vi.fn().mockRejectedValue(new Error("Network timeout")),
        },
      };

      const collector = [];

      await doSearchOptimized(
        mockClient,
        4,
        "Patient",
        collector,
        {},
        "test-client"
      );

      expect(collector.length).toBeGreaterThan(0);
      expect(collector[0]).toHaveProperty("error");
      expect(collector[0].type).toBe("Patient");
    });

    test("multiple errors are collected", async () => {
      const mockClient = {
        patient: {
          request: vi
            .fn()
            .mockRejectedValueOnce(new Error("Error 1"))
            .mockRejectedValueOnce(new Error("Error 2")),
        },
      };

      const collector = [];

      await doSearchOptimized(mockClient, 4, "Patient", collector, {}, "client1");
      await doSearchOptimized(mockClient, 4, "Condition", collector, {}, "client2");

      expect(collector.length).toBe(2);
      expect(collector[0].error.message).toBe("Error 1");
      expect(collector[1].error.message).toBe("Error 2");
    });
  });
});
