/**
 * MME Calculations unit test
 */

import { describe, it, expect } from "vitest";
import MMECalculator from "../../../utils/MMECalculator";

describe("MME Calculations (Using John Cushing data)", () => {
  it("should calculate correct MME for Dilaudid hydromorphone hydrochloride 4 MG Oral Tablet", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "897702" },
            display: { value: "Dilaudid hydromorphone hydrochloride 4 MG Oral Tablet" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: {
          value: { value: 180 },
        },
        expectedSupplyDuration: {
          value: { value: 45 },
          unit: { value: "days" },
        },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    // expect(mmeResults).toHaveLength(1);
    expect(mmeResults[0].dosesPerDay).toBe(4);
    expect(mmeResults[0].strength.value).toBe(4);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(5); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(80.0); // 4 * 4 * 5
  });

  it("should calculate correct MME for 4 HR hydromorphone hydrochloride 12 MG Extended Release Oral Tablet", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "902729" },
            display: { value: "4 HR hydromorphone hydrochloride 12 MG Extended Release Oral Tablet" },
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
    expect(mmeResults[0].strength.value).toBe(12);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(5); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(60.0);  // 1 x 12 x 5
  });

  it("should calculate correct MME for Lortab acetaminophen 325 MG / hydrocodone bitartrate 10 MG Oral Tablet", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "856999" },
            display: { value: "Lortab acetaminophen 325 MG / hydrocodone bitartrate 10 MG Oral Tablet" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: { value: { value: 45 } },
        expectedSupplyDuration: { value: { value: 15 } },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(3);
    expect(mmeResults[0].strength.value).toBe(10);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(1); // Oxycodone conversion factor
    expect(mmeResults[0].mme).toBe(30); // 3 x 10 x 1
  });

});
