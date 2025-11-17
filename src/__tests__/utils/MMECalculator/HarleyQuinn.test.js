/**
 * MME Calculations unit test
 */

import { describe, it, expect } from "vitest";
import MMECalculator from "../../../utils/MMECalculator";

describe("MME Calculations (Using Harley Quinn data)", () => {
  it("should calculate correct MME for HYDROCODONE-ACETAMIN 7.5-325", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "857005" },
            display: { value: "HYDROCODONE-ACETAMIN 7.5-325" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: {
          value: { value: 240 },
        },
        expectedSupplyDuration: {
          value: { value: 30 },
          unit: { value: "days" },
        },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(8);
    expect(mmeResults[0].strength.value).toBe(7.5);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(1); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(60.0); // 8 * 7.5 * 1
  });

  it("should calculate correct MME for FENTANYL 75 MCG/HR PATCH", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "197696" },
            display: { value: "FENTANYL 75 MCG/HR PATCH" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: { value: { value: 10 } },
        expectedSupplyDuration: { value: { value: 30 } },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBeCloseTo(0.33, 2); // 90 / 45
    expect(mmeResults[0].strength.value).toBe(75);
    expect(mmeResults[0].strength.unit).toBe("ug/h");
    expect(mmeResults[0].conversionFactor).toBe(7.2); // Morphine conversion factor
    expect(Math.round(mmeResults[0].mme)).toBe(180); // 75 * 7.2 * 0.33
  });
});
