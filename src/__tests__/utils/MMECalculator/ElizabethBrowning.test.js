/**
 * MME Calculations unit test
 */

import { describe, it, expect } from "vitest";
import MMECalculator from "../../../utils/MMECalculator";

describe("MME Calculations (Using Elizabeth Browning data)", () => {
  it("should calculate correct MME for Butrans- 168 HR buprenorphine 0.005 MG/HR Transdermal System", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "904880" },
            display: { value: "168 HR Buprenorphine 0.005 MG/HR Transdermal System" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: {
          value: { value: 4 },
        },
        expectedSupplyDuration: {
          value: { value: 28 },
          unit: { value: "days" },
        },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);
    expect(mmeResults[0].dosesPerDay).toBeCloseTo(0.14, 2);
    expect(mmeResults[0].strength.value).toBeCloseTo(5);
    expect(mmeResults[0].strength.unit).toBe("ug/h");
    expect(mmeResults[0].conversionFactor).toBe(15.4); // Morphine conversion factor
    expect(Math.round(mmeResults[0].mme)).toBe(11); // 0.14 x 5 x 15.4
  });

  it("should calculate correct MME for Suboxone - Buprenorphine/ naloxone sublingual film 2/.5 MG", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "1010600" },
            display: { value: "Buprenorphine 2 MG / Naloxone 0.5 MG Sublingual Film" },
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
    expect(mmeResults[0].strength.value).toBe(2);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(30); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(60.0);  // 1 x 2 x 30
  });

  it("should calculate correct MME for Methadone 10mg/mL 5 mL solution", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "991149" },
            display: { value: "Methadone Hydrochloride 10 MG/ML Oral Solution [Methadose]" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: { value: { value: 120 } },
        expectedSupplyDuration: { value: { value: 60 } },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(2);
    expect(mmeResults[0].strength.value).toBe(10);
    expect(mmeResults[0].strength.unit).toBe("mg/mL");
    expect(mmeResults[0].conversionFactor).toBe(4); // Oxycodone conversion factor
    expect(mmeResults[0].mme).toBe(80); // 2 x 10 x 4
  });

  it("should calculate correct MME for Methadone 40 mg diskette", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "1990745" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: { value: { value: 14 } },
        expectedSupplyDuration: { value: { value: 7 } },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(2); // 14 / 7
    expect(mmeResults[0].strength.value).toBe(40);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(12); // Hydrocodone conversion factor
    expect(mmeResults[0].mme).toBe(960); // 2 x 12 x 40
  });
});
