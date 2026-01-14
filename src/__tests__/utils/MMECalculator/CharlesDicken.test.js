/**
 * MME Calculations unit test
 */

import { describe, it, expect } from "vitest";
import MMECalculator from "../../../utils/MMECalculator";

describe("MME Calculations (Using Charles Dicken data)", () => {
  it("should calculate correct MME for oxycodone hydrochloride 5 MG Oral Tablet", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "1049621" },
            display: { value: "oxycodone hydrochloride 5 MG Oral Tablet" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: {
          value: { value: 30 },
        },
        expectedSupplyDuration: {
          value: { value: 10 },
          unit: { value: "days" },
        },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(3);
    expect(mmeResults[0].strength.value).toBe(5);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(1.5); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(22.5); // 3 * 5 * 1.5
  });

  it("should calculate correct MME for acetaminophen 325 MG / oxycodone hydrochloride 2.5 MG Oral Tablet", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "1049635" },
            display: { value: "acetaminophen 325 MG / oxycodone hydrochloride 2.5 MG Oral Tablet" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: { value: { value: 90 } },
        expectedSupplyDuration: { value: { value: 45 } },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(2); // 90 / 45
    expect(mmeResults[0].strength.value).toBe(2.5);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(1.5); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(7.5);  // 2 x 2.5 x 1.5
  });

});
