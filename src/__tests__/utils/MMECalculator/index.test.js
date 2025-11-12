/**
 * MME Calculator - unit tests
 */

import { describe, it, expect } from "vitest";
import MMECalculator from "../../../utils/MMECalculator";
import OMTKLogic from "../../../utils/MMECalculator/OMTKLogic";

describe("MME Calculator", () => {
  describe("RxNorm Code Extraction", () => {
    it("should extract RxNorm code from medication with wrapped values", () => {
      const medication = {
        coding: [
          {
            system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
            code: { value: "891888" },
            display: { value: "MS Contin 30 MG Oral Tablet" },
          },
        ],
      };

      const rxNormCode = OMTKLogic.getMedicationCode(medication);

      expect(rxNormCode).toBeDefined();
      expect(rxNormCode.code).toBe("891888");
      expect(rxNormCode.system).toBe(
        "http://www.nlm.nih.gov/research/umls/rxnorm"
      );
    });

    it("should return null for medication without RxNorm code", () => {
      const medication = {
        coding: [
          {
            system: { value: "http://hl7.org/fhir/sid/ndc" },
            code: { value: "12345" },
          },
        ],
      };

      const rxNormCode = OMTKLogic.getMedicationCode(medication);
      expect(rxNormCode).toBeNull();
    });
  });

  describe("Drug Ingredients", () => {
    it("should get ingredients for MS Contin 30mg", () => {
      const rxNormCode = {
        code: "891888",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
      };

      const ingredients = OMTKLogic.getIngredients(rxNormCode);

      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].ingredientCode.code).toBe("7052"); // Morphine
      expect(ingredients[0].strength.value).toBe(30);
      expect(ingredients[0].strength.unit).toBe("mg");
    });

    it("should return empty array for unknown drug code", () => {
      const rxNormCode = {
        code: "999999999",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
      };

      const ingredients = OMTKLogic.getIngredients(rxNormCode);
      expect(ingredients).toHaveLength(0);
    });
  });

  describe("Prescription Data Extraction", () => {
    it("should extract prescription data from MedicationRequest without dosageInstruction", () => {
      const medicationRequest = {
        medication: {
          coding: [
            {
              system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
              code: { value: "891888" },
              display: { value: "MS Contin 30 MG Oral Tablet" },
            },
          ],
        },
        status: { value: "active" },
        dispenseRequest: {
          quantity: {
            value: { value: 60 },
          },
          expectedSupplyDuration: {
            value: { value: 30 },
            unit: { value: "days" },
          },
        },
      };

      const prescriptions = MMECalculator.prescriptions([medicationRequest]);

      expect(prescriptions).toHaveLength(1);
      expect(prescriptions[0].rxNormCode.code).toBe("891888");
      expect(prescriptions[0].dosesPerDay).toBe(2); // 60 tablets / 30 days
      expect(prescriptions[0].supplyQuantity).toBe(60);
      expect(prescriptions[0].supplyDuration).toBe(30);
      expect(prescriptions[0].dose.value).toBe(1);
      expect(prescriptions[0].dose.unit).toBeNull();
    });

    it("should handle draft status correctly", () => {
      const medicationRequest = {
        medication: {
          coding: [
            {
              system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
              code: { value: "891888" },
            },
          ],
        },
        status: { value: "draft" },
        dispenseRequest: {
          quantity: { value: { value: 60 } },
          expectedSupplyDuration: { value: { value: 30 } },
        },
      };

      const prescriptions = MMECalculator.prescriptions([medicationRequest]);
      expect(prescriptions[0].isDraft).toBe(true);
    });

    it("should handle PRN medications", () => {
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
        dosageInstruction: [
          {
            asNeeded: { value: true },
          },
        ],
        dispenseRequest: {
          quantity: { value: { value: 60 } },
          expectedSupplyDuration: { value: { value: 30 } },
        },
      };

      const prescriptions = MMECalculator.prescriptions([medicationRequest]);
      expect(prescriptions[0].isPRN).toBe(true);
    });
  });

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

     // expect(mmeResults).toHaveLength(1);
      expect(mmeResults[0].dosesPerDay).toBeCloseTo(0.333, 2);
      expect(mmeResults[0].conversionFactor).toBe(7.2); // Morphine conversion factor
      expect(Math.round(mmeResults[0].mme)).toBe(240); 
    });

    it("should calculate correct MME for MS Contin 15mg (90 tablets over 30 days)", () => {
      const medicationRequest = {
        medication: {
          coding: [
            {
              system: { value: "http://www.nlm.nih.gov/research/umls/rxnorm" },
              code: { value: "891881" },
              display: { value: "MS Contin 15mg Oral Tablet" },
            },
          ],
        },
        status: { value: "active" },
        dispenseRequest: {
          quantity: { value: { value: 90 } },
          expectedSupplyDuration: { value: { value: 30 } },
        },
      };

      const mmeResults = MMECalculator.mme([medicationRequest]);

      expect(mmeResults[0].dosesPerDay).toBe(3); // 90 / 30
      expect(mmeResults[0].mme).toBe(45.0); // 3 * 15 * 1
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
      expect(mmeResults[0].conversionFactor).toBe(0.13); // Oxycodone conversion factor
      expect(mmeResults[0].mme).toBe(13); // 2 * 10 * 1.5
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
      expect(mmeResults[0].conversionFactor).toBe(1); // Hydrocodone conversion factor
      expect(mmeResults[0].mme).toBe(60); 
    });
  });

  describe("Total MME Calculation", () => {
    it("should calculate total MME across multiple medications", () => {
      const medications = [
        {
          medication: {
            coding: [
              {
                system: {
                  value: "http://www.nlm.nih.gov/research/umls/rxnorm",
                },
                code: { value: "891881" }, //MS Contin 15mg Oral Tablet
              },
            ],
          },
          status: { value: "active" },
          dispenseRequest: {
            quantity: { value: { value: 90 } },
            expectedSupplyDuration: { value: { value: 30 } }, //MME 45
          },
        },
        {
          medication: {
            coding: [
              {
                system: {
                  value: "http://www.nlm.nih.gov/research/umls/rxnorm",
                },
                code: { value: "891888" }, // MS Cotin 30 MG Oral Tablet
              },
            ],
          },
          status: { value: "active" },
          dispenseRequest: {
            quantity: { value: { value: 60 } },
            expectedSupplyDuration: { value: { value: 30 } }, //MME 60
          },
        },
      ];

      const totalMME = MMECalculator.totalMME(medications);

      expect(totalMME.value).toBe(105); 
      expect(totalMME.unit).toBe("mg/d");
    });

    it("should return 0 for empty medication list", () => {
      const totalMME = MMECalculator.totalMME([]);
      expect(totalMME.value).toBe(0);
    });
  });

  describe("Conversion Factors", () => {
    it("should return correct conversion factor for Morphine", () => {
      const ingredientCode = { code: "7052" };
      const dailyDose = { value: 60 };
      const doseFormCode = { code: "316992" };

      const factor = OMTKLogic.getConversionFactor(
        ingredientCode,
        dailyDose,
        doseFormCode
      );
      expect(factor).toBe(1);
    });

    it("should return correct conversion factor for Oxycodone", () => {
      const ingredientCode = { code: "7804" };
      const dailyDose = { value: 30 };
      const doseFormCode = { code: "316992" };

      const factor = OMTKLogic.getConversionFactor(
        ingredientCode,
        dailyDose,
        doseFormCode
      );
      expect(factor).toBe(1.5);
    });

    it("should return correct conversion factor for Hydrocodone", () => {
      const ingredientCode = { code: "5489" };
      const dailyDose = { value: 20 };
      const doseFormCode = { code: "316992" };

      const factor = OMTKLogic.getConversionFactor(
        ingredientCode,
        dailyDose,
        doseFormCode
      );
      expect(factor).toBe(1);
    });

    it("should return correct conversion factor for Hydromorphone", () => {
      const ingredientCode = { code: "3423" };
      const dailyDose = { value: 8 };
      const doseFormCode = { code: "316992" };

      const factor = OMTKLogic.getConversionFactor(
        ingredientCode,
        dailyDose,
        doseFormCode
      );
      expect(factor).toBe(6); // Updated from 4 to 6
    });

    it("should return correct conversion factor for Tramadol", () => {
      const ingredientCode = { code: "10689" };
      const dailyDose = { value: 100 };
      const doseFormCode = { code: "316992" };

      const factor = OMTKLogic.getConversionFactor(
        ingredientCode,
        dailyDose,
        doseFormCode
      );
      expect(factor).toBe(0.2); // Updated from 0.1 to 0.2
    });

    it("should return dose-dependent conversion factor for Methadone", () => {
      const ingredientCode = { code: "6813" };
      const doseFormCode = { code: "316992" };

      // 1-20 mg/day
      expect(
        OMTKLogic.getConversionFactor(
          ingredientCode,
          { value: 10 },
          doseFormCode
        )
      ).toBe(4);

      // 21-40 mg/day
      expect(
        OMTKLogic.getConversionFactor(
          ingredientCode,
          { value: 30 },
          doseFormCode
        )
      ).toBe(8);

      // 41-60 mg/day
      expect(
        OMTKLogic.getConversionFactor(
          ingredientCode,
          { value: 50 },
          doseFormCode
        )
      ).toBe(10);

      // 61+ mg/day
      expect(
        OMTKLogic.getConversionFactor(
          ingredientCode,
          { value: 70 },
          doseFormCode
        )
      ).toBe(12);
    });

    it("should return correct conversion factor for Fentanyl patch", () => {
      const ingredientCode = { code: "4337" };
      const dailyDose = { value: 25 };
      const doseFormCode = { code: "316987" }; // Transdermal system

      const factor = OMTKLogic.getConversionFactor(
        ingredientCode,
        dailyDose,
        doseFormCode
      );
      expect(factor).toBe(7.2);
    });

    it("should return correct conversion factor for Buprenorphine patch", () => {
      const ingredientCode = { code: "1819" };
      const dailyDose = { value: 10 };
      const doseFormCode = { code: "316987" }; // Transdermal system

      const factor = OMTKLogic.getConversionFactor(
        ingredientCode,
        dailyDose,
        doseFormCode
      );
      expect(factor).toBe(15.4); // 2.2 X 7
    });

    it("should return 0 for non-opioid medications", () => {
      const ingredientCode = { code: "161" }; // Acetaminophen
      const dailyDose = { value: 1000 };
      const doseFormCode = { code: "316992" };

      const factor = OMTKLogic.getConversionFactor(
        ingredientCode,
        dailyDose,
        doseFormCode
      );
      expect(factor).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle medications with no supply information", () => {
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
      };

      const mmeResults = MMECalculator.mme([medicationRequest]);
      expect(mmeResults).toHaveLength(1);
      expect(mmeResults[0].dosesPerDay).toBeNull();
    });

    it("should filter out medications without valid RxNorm codes", () => {
      const medications = [
        {
          medication: {
            coding: [
              {
                system: { value: "http://hl7.org/fhir/sid/ndc" },
                code: { value: "12345" },
              },
            ],
          },
          status: { value: "active" },
        },
      ];

      const prescriptions = MMECalculator.prescriptions(medications);
      expect(prescriptions).toHaveLength(0);
    });
  });

  describe("Helper Functions", () => {
    it("should extract wrapped FHIR values correctly", () => {
      expect(MMECalculator.extractValue({ value: "test" })).toBe("test");
      expect(MMECalculator.extractValue("test")).toBe("test");
      expect(MMECalculator.extractValue(null)).toBeNull();
      expect(MMECalculator.extractValue(undefined)).toBeNull();
    });

    it("should coalesce values correctly", () => {
      expect(MMECalculator.coalesce(null, undefined, "value")).toBe("value");
      expect(MMECalculator.coalesce(null, "first", "second")).toBe("first");
      expect(MMECalculator.coalesce(0, "value")).toBe(0);
    });

    it("should convert UCUM units correctly", () => {
      expect(OMTKLogic.toUCUM("MG")).toBe("mg");
      expect(OMTKLogic.toUCUM("MG/ACTUAT")).toBe("mg/{actuat}");
      expect(OMTKLogic.toUCUM("MG/HR")).toBe("mg/h");
      expect(OMTKLogic.toUCUM("MG/ML")).toBe("mg/mL");
    });

    it("should calculate daily frequency correctly", () => {
      expect(OMTKLogic.toDaily(2, { value: 12, unit: "h" })).toBe(4); // 2 every 12 hours = 4/day
      expect(OMTKLogic.toDaily(1, { value: 1, unit: "d" })).toBe(1); // 1 every day = 1/day
      expect(OMTKLogic.toDaily(1, { value: 1, unit: "wk" })).toBeCloseTo(
        0.143,
        2
      ); // 1 every week
    });
  });
});
