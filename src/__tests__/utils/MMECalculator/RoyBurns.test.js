/**
 * MME Calculations unit test
 */

import { describe, it, expect } from "vitest";
import MMECalculator from "../../../utils/MMECalculator";

describe("MME Calculations (Using Roy Burns data)", () => {
  it("should calculate correct MME for HYDROCODONE-ACETAMIN 10-325 MG", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "856999" },
            display: { value: "HYDROCODONE-ACETAMIN 10-325 MG" },
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
    expect(mmeResults[0].strength.value).toBe(10);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(1); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(80.0); // 8 * 10 * 1
  });

  it("should calculate correct MME for HYDROCODONE-ACETAMIN 10-325 MG", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "856999" },
            display: { value: " HYDROCODONE-ACETAMIN 10-325 MG" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: { value: { value: 120 } },
        expectedSupplyDuration: { value: { value: 30 } },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(4); // 90 / 45
    expect(mmeResults[0].strength.value).toBe(10);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(1); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(40);  // 4 * 10 * 1
  });

});
