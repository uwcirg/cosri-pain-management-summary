/**
 * MME Calculations unit test
 */

import { describe, it, expect } from "vitest";
import MMECalculator from "../../../utils/MMECalculator";
import { NullMessageListener } from "cql-execution";

describe("MME Calculations (Using ElizabethReplaceTherapy data)", () => {
  it("should calculate correct MME for Butrans- 168 HR buprenorphine 0.005 MG/HR Transdermal System", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "904880" },
            display: { value: "Butrans- 168 HR buprenorphine 0.005 MG/HR Transdermal System" },
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
        },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBeCloseTo(0.14, 2);
    expect(mmeResults[0].strength.value).toBe(5);
    expect(mmeResults[0].strength.unit).toBe("ug/h");
    expect(mmeResults[0].conversionFactor).toBe(15.4); // Morphine conversion factor
    expect(mmeResults[0].mme).closeTo(10.99, 2); // 0.14 x 5 x 15.4
  });

  it("should calculate correct MME for Suboxone - Buprenorphine/ naloxone sublingual film 4/1 MG", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "1307056" },
            display: { value: "Suboxone - Buprenorphine/ naloxone sublingual film 4/1 MG" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: {
          value: { value: 30 },
        },
        expectedSupplyDuration: {
          value: { value: 30 },
        },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(1);
    expect(mmeResults[0].strength.value).toBe(4);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(30); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(120); // 1 x 4 x 30
  });

  it("should calculate correct MME for Methadone 10mg/mL 5 mL solution", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "991149" },
            display: { value: "Methadone 10mg/mL 5 mL solution" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: {
          value: { value: 240 },
        },
        expectedSupplyDuration: {
          value: { value: 60 },
        },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(4);
    expect(mmeResults[0].strength.value).toBe(10);
    expect(mmeResults[0].strength.unit).toBe("mg/mL");
    expect(mmeResults[0].conversionFactor).toBe(8); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(320); // 4 x 10 x 8
  });

  it("should return null for fenfluramine 2.2 MG/ML Oral Solution", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "2381144" },
            display: { value: "fenfluramine 2.2 MG/ML Oral Solution" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: {
          value: { value: 60 },
        },
        expectedSupplyDuration: {
          value: { value: 60 },
        },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);
    expect(mmeResults.length).toBe(0);
  });

  it("should calculate correct MME for Methadone 40 mg diskette", () => {
    const medicationRequest = {
      medication: {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "1990745" },
            display: { value: "Methadone 40 mg diskette" },
          },
        ],
      },
      status: { value: "active" },
      dispenseRequest: {
        quantity: {
          value: { value: 31 },
        },
        expectedSupplyDuration: {
          value: { value: 31 },
        },
      },
    };

    const mmeResults = MMECalculator.mme([medicationRequest]);

    expect(mmeResults[0].dosesPerDay).toBe(1);
    expect(mmeResults[0].strength.value).toBe(40);
    expect(mmeResults[0].strength.unit).toBe("mg");
    expect(mmeResults[0].conversionFactor).toBe(8); // Morphine conversion factor
    expect(mmeResults[0].mme).toBe(320); // 1 x 40 x 8
  });

  

});
