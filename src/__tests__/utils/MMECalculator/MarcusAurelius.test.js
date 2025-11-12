/**
 * MME Calculations unit test
 */

import { describe, it, expect } from "vitest";
import MMECalculator from "../../../utils/MMECalculator";

describe("MME Calculations (Using Marcus Aurelius data)", () => {
  it("should calculate correct MME for Fentanyl Transdermal System, 0.1 mg/hr (10 over 30 days)", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "245136" },
            display: { value: "Fentanyl Transdermal System, 0.1 mg/hr" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: {
          value: { value: 10 },
        },
        expectedSupplyDuration: {
          value: { value: 30 },
          unit: { value: "days" },
        },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBeCloseTo(0.333, 2); // 10 / 30
    expect(mmeResults[0].strength.value).toBe(100);
    expect(mmeResults[0].strength.unit).toBe("ug/h");
    expect(mmeResults[0].conversionFactor).toBe(7.2); // Morphine conversion factor
    expect(Math.round(mmeResults[0].mme)).toBe(240); // 0.333 x 100 x 7.2
  });

  it("should calculate correct MME for OxyContin 30 MG Extended Release Oral Tablet", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "1049576" },
            display: "Abuse-Deterrent 12 HR Oxycodone Hydrochloride 30 MG Extended Release Oral Tablet [Oxycontin]"

          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: { value: { value: 30 } },
        expectedSupplyDuration: { value: { value: 30 } },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(1); // 30 / 30
    expect(mmeResults[0].strength.value).toBe(30);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(1.5); // Morphine conversion factor
    expect(Math.round(mmeResults[0].mme)).toBe(45); // 1.5 x 1 x 30
  });

  it("should calculate correct MME for Fentanyl 0.1 MG Buccal Tablet", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "668363" },
            display: { value: "Fentanyl 0.1 MG Buccal Tablet" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: { value: { value: 10 } },
        expectedSupplyDuration: { value: { value: 10 } },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(1);
    expect(mmeResults[0].strength.value).toBe(100);
    expect(mmeResults[0].strength.unit).toBe("ug");
    expect(mmeResults[0].conversionFactor).toBe(0.13); // Oxycodone conversion factor
    expect(mmeResults[0].mme).toBe(13); // 1 * 100 * 0.13
  });

  it("should calculate correct MME for MS Cotin 30 MG Oral Tablet", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "891888" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: { value: { value: 60 } },
        expectedSupplyDuration: { value: { value: 30 } },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(2); // 60 / 30
    expect(mmeResults[0].strength.value).toBe(30);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(1); // Hydrocodone conversion factor
    expect(mmeResults[0].mme).toBe(60); // 2 * 30 * 1
  });
});
