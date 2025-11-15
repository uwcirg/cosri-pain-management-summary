import OMTKData from "./OMTKData";
/**
 * OMTKLogic - JavaScript Implementation, see original source ./src/cql/OMTKLogic.cql
 * direct translation from CQL to Javascript with syntax updated as needed
 *
 * Based on:
 * - CDC Opioid Prescribing Guideline
 * - http://build.fhir.org/ig/cqframework/opioid-cds-r4/service-documentation.html
 *
 */

const OMTKLogic = {
  ErrorLevel: "Warning",

  /**
   * Normalizes input units to UCUM units
   * Based on HL7 UCUM subset: http://download.hl7.de/documents/ucum/ucumdata.html
   */
  toUCUM(unit) {
    switch (unit) {
      case "mg":
      case "MG":
        return "mg";
      case "mg/actuat":
      case "MG/ACTUAT":
        return "mg/{actuat}";
      case "mg/hr":
      case "MG/HR":
        return "mg/h";
      case "mg/ml":
      case "MG/ML":
        return "mg/mL";
      default:
        console.warn(`Unknown unit: ${unit}`);
        return null;
    }
  },

  /**
   * Calculates daily frequency given frequency within a period
   */
  toDaily(frequency, period) {
    if (!period || !period.unit) {
      return null;
    }

    const freq = frequency || 0;
    const periodValue = period.value || 1;

    switch (period.unit) {
      case "h":
      case "hour":
      case "hours":
        return freq * (24.0 / periodValue);

      case "min":
      case "minute":
      case "minutes":
        return freq * (24.0 / periodValue) * 60;

      case "s":
      case "second":
      case "seconds":
        return freq * (24.0 / periodValue) * 60 * 60;

      case "d":
      case "day":
      case "days":
        return (freq * (24.0 / periodValue)) / 24;

      case "wk":
      case "week":
      case "weeks":
        return (freq * (24.0 / periodValue)) / (24 * 7);

      case "mo":
      case "month":
      case "months":
        return (freq * (24.0 / periodValue)) / (24 * 30); // assuming 30 days in month

      case "a":
      case "year":
      case "years":
        return (freq * (24.0 / periodValue)) / (24 * 365); // assuming 365 days in year

      default:
        console.error(`Unknown period unit: ${period.unit}`);
        return null;
    }
  },

  /**
   * Returns the conversion factor for the given ingredient
   *
   * CDC Guidance:
   * https://www.cdc.gov/drugoverdose/pdf/calculating_total_daily_dose-a.pdf
   * https://www.cdc.gov/drugoverdose/modules/data-files.html
   *
   * CMS Guidance:
   * https://www.cms.gov/Medicare/Prescription-Drug-Coverage/PrescriptionDrugCovContra/Downloads/Oral-MME-CFs-vFeb-2018.pdf
   */
  getConversionFactor(ingredientCode, dailyDose, doseFormCode) {
    const ingredientCodeInt = parseInt(ingredientCode.code);
    const doseFormCodeInt = parseInt(doseFormCode.code);
    const dailyDoseValue = dailyDose ? dailyDose.value : 0;

    switch (ingredientCodeInt) {
      case 161:
        return 0; // Acetaminophen

      case 480: // Alfentanil
        if (doseFormCodeInt === 1649574) return 400; // injection
        console.error(
          `Unknown dose form code for Alfentanil: ${doseFormCode.code}`
        );
        return null;

      case 1191:
        return 0; // Aspirin
      case 1223:
        return 0; // Atropine
      case 1767:
        return 0; // Brompheniramine

      case 1819: // Buprenorphine
        if (doseFormCodeInt === 316987) return 15.4; // Transdermal system (2.2 X 7)
        return 30; // Tablet or Film

      case 1841:
        return 7; // Butorphanol
      case 1886:
        return 0; // Caffeine
      case 2101:
        return 0; // Carisoprodol
      case 2354:
        return 0; // chlorcyclizine
      case 2400:
        return 0; // Chlorpheniramine
      case 3500:
        return 0.15; // Diphenoxylate
      case 2670:
        return 0.15; // Codeine
      case 3423:
        return 5; // Hydromorphone
      case 3498:
        return 0; // Diphenhydramine

      case 56795: // Sufentanil
        if (doseFormCodeInt === 1649574) return 2; // injection
        console.error(
          `Unknown dose form code for Sufentanil: ${doseFormCode.code}`
        );
        return null;

      case 4337: // Fentanyl
        if ([970789, 317007, 316992].includes(doseFormCodeInt)) return 0.13; // Buccal/Sublingual Tablet, Oral Lozenge
        if (doseFormCodeInt === 746839) return 0.18; // Film or oral spray
        if (doseFormCodeInt === 1649574) return 1; // injection
        if (doseFormCodeInt === 1294702) return 0.13; // lozenge Product
        if (doseFormCodeInt === 858080) return 0.18; // Buccal Film
        if ([126542, 346163, 1797831].includes(doseFormCodeInt)) return 0.16; // Nasal Spray
        if (doseFormCodeInt === 346163) return 0.18; // Mucosal Spray
        if (doseFormCodeInt === 316987) return 7.2; // Transdermal system (updated from 2.4)
        console.error(
          `Unknown dose form code for Fentanyl: ${doseFormCode.code}`
        );
        return null;

      case 5032:
        return 0; // Guaifenesin
      case 5489:
        return 1; // Hydrocodone
      case 5640:
        return 0; // Ibuprofen
      case 6102:
        return 0; // Kaolin
      case 6378:
        return 11; // Levorphanol

      case 6754: // Meperidine
        if (doseFormCodeInt === 721656) return 0.3; // IV form
        return 0.1; // Oral

      case 6813: // Methadone - dose-dependent conversion
        const dailyDoseCeiling = Math.ceil(dailyDoseValue);
        if (dailyDoseCeiling >= 1 && dailyDoseCeiling <= 20) return 4;
        if (dailyDoseCeiling >= 21 && dailyDoseCeiling <= 40) return 8;
        if (dailyDoseCeiling >= 41 && dailyDoseCeiling <= 60) return 10;
        if (dailyDoseCeiling >= 61) return 12;
        if (dailyDoseValue < 1) {
          console.error("Daily dose less than 1 for Methadone");
        }
        return null;

      case 7052:
        return 1; // Morphine
      case 7242:
        return 0; // Naloxone
      case 7243:
        return 0; // Naltrexone
      case 7804:
        return 1.5; // Oxycodone
      case 7814:
        return 3; // Oxymorphone
      case 8001:
        return 0.37; // Pentazocine
      case 8163:
        return 0; // Phenylephrine
      case 8175:
        return 0; // Phenylpropanolamine
      case 8745:
        return 0; // Promethazine
      case 8896:
        return 0; // Pseudoephedrine
      case 9009:
        return 0; // Pyrilamine
      case 10689:
        return 0.2; // Tramadol (updated from 0.1)
      case 10849:
        return 0; // Triprolidine
      case 19759:
        return 0; // bromodiphenhydramine
      case 19860:
        return 0; // butalbital
      case 22696:
        return 0; // dexbrompheniramine
      case 22697:
        return 0; // dexchlorpheniramine
      case 23088:
        return 0.25; // dihydrocodeine
      case 27084:
        return 0; // homatropine
      case 35780:
        return 0; // ropivacaine
      case 237005:
        return 8; // Levomethadyl acetate
      case 636827:
        return 0; // guaiacolsulfonate
      case 787390:
        return 0.4; // tapentadol

      case 73032: // remifentanil
        if (doseFormCodeInt === 1649574) return 100; // injection
        console.error(
          `Unknown dose form code for remifentanil: ${doseFormCode.code}`
        );
        return null;

      case 2001352:
        return 1.22; // benzhydrocodone
      case 2392230:
        return 5; // oliceridine

      default:
        console.error(`Unknown ingredient code: ${ingredientCode.code}`);
        return null;
    }
  },

  /**
   * Ensures strength is in microgram units if the value is very small
   */
  ensureMicrogramQuantity(strength) {
    if (!strength) return null;

    if (
      strength.value <= 0.1 &&
      strength.unit &&
      strength.unit.indexOf("mg") === 0
    ) {
      return {
        value: strength.value * 1000,
        unit: "ug" + strength.unit.substring(2),
      };
    }

    return strength;
  },

  /**
   * Returns the opioid ingredients and their strengths for the given rxNormCode
   */
  getIngredients(rxNormCode) {
    if (!rxNormCode || !rxNormCode.code) return [];

    const drugCode = parseInt(rxNormCode.code);

    // Filter DrugIngredients from OMTKData
    const ingredients = OMTKData.DrugIngredients.filter(
      (di) => di.drugCode === drugCode
    );

    return ingredients.map((di) => {
      const unit = this.toUCUM(di.strengthUnit);

      return {
        rxNormCode: {
          code: di.drugCode.toString(),
          system: "http://www.nlm.nih.gov/research/umls/rxnorm",
          display: di.drugName,
        },
        doseFormCode: {
          code: di.doseFormCode.toString(),
          system: "http://www.nlm.nih.gov/research/umls/rxnorm",
          display: di.doseFormName,
        },
        ingredientCode: {
          code: di.ingredientCode.toString(),
          system: "http://www.nlm.nih.gov/research/umls/rxnorm",
          display: di.ingredientName,
        },
        unit: unit,
        strength: this.ensureMicrogramQuantity({
          value: di.strengthValue,
          unit: unit,
        }),
      };
    });
  },

  /**
   * Helper to safely extract value from FHIR primitive types
   * Handles both { value: "x" } and "x" formats
   */
  extractValue(obj) {
    if (obj === null || obj === undefined) return null;
    if (typeof obj === "object" && "value" in obj) return obj.value;
    return obj;
  },

  /**
   * Returns the first RxNorm code in the concept that matches a drug code in OMTKData
   */
  getMedicationCode(concept) {
    if (!concept || !concept.coding) return null;

    for (const code of concept.coding) {
      const system = this.extractValue(code.system);
      const codeValue = this.extractValue(code.code);
      const display = this.extractValue(code.display);

      if (system === "http://www.nlm.nih.gov/research/umls/rxnorm") {
        const drugCode = parseInt(codeValue);
        const drugIngredient = OMTKData.DrugIngredients.find(
          (di) => di.drugCode === drugCode
        );

        if (drugIngredient) {
          return {
            code: drugIngredient.drugCode.toString(),
            system: "http://www.nlm.nih.gov/research/umls/rxnorm",
            display: drugIngredient.drugName,
          };
        }
      }
    }

    return null;
  },

  /**
   * Returns the display name of the given concept
   */
  getMedicationConceptName(concept) {
    if (!concept) return null;

    if (concept.text) {
      return concept.text;
    }

    if (concept.coding) {
      for (const code of concept.coding) {
        if (code.system === "http://www.nlm.nih.gov/research/umls/rxnorm") {
          return this.getMedicationName(code);
        }
      }
    }

    return null;
  },

  /**
   * Returns the display name of the medication from the RxNorm code
   */
  getMedicationName(rxNormCode) {
    if (!rxNormCode) return null;

    if (rxNormCode.display) {
      return rxNormCode.display;
    }

    const drugCode = parseInt(rxNormCode.code);
    const drugIngredient = OMTKData.DrugIngredients.find(
      (di) => di.drugCode === drugCode
    );

    return drugIngredient ? drugIngredient.drugName : null;
  },

  /**
   * Returns the display name of the ingredient
   */
  getIngredientName(ingredientCode) {
    if (!ingredientCode) return null;

    if (ingredientCode.display) {
      return ingredientCode.display;
    }

    const code = parseInt(ingredientCode.code);
    const drugIngredient = OMTKData.DrugIngredients.find(
      (di) => di.ingredientCode === code
    );

    return drugIngredient ? drugIngredient.ingredientName : null;
  },

  /**
   * Returns the display name of the dose form
   */
  getDoseFormName(doseFormCode) {
    if (!doseFormCode) return null;

    if (doseFormCode.display) {
      return doseFormCode.display;
    }

    const code = parseInt(doseFormCode.code);
    const drugIngredient = OMTKData.DrugIngredients.find(
      (di) => di.doseFormCode === code
    );

    return drugIngredient ? drugIngredient.doseFormName : null;
  },

  /**
   * Removes the last per argument from a unit
   */
  stripPer(unit) {
    if (!unit) return unit;

    const split = unit.split("/");
    const splitCount = split.length;

    if (splitCount > 1) {
      return unit.substring(0, unit.length - split[splitCount - 1].length - 1);
    }

    return unit;
  },

  /**
   * Calculates daily dose for a specific ingredient
   */
  getDailyDose(
    ingredientCode,
    strength,
    doseFormCode,
    doseQuantity,
    dosesPerDay
  ) {
    if (!dosesPerDay || !doseQuantity || !strength) {
      return null;
    }

    const ingredientCodeInt = parseInt(ingredientCode.code);
    const doseFormCodeInt = parseInt(doseFormCode.code);

    // If patch (transdermal system)
    if (doseFormCodeInt === 316987) {
      // Buprenorphine or Fentanyl patch
      if ([1819, 4337].includes(ingredientCodeInt)) {
        return {
          value: dosesPerDay * strength.value,
          unit: strength.unit,
        };
      } else {
        console.error(
          `Unknown patch ingredient: ${ingredientCode.code}:${ingredientCode.display}`
        );
        return null;
      }
    }

    // If dose unit in actual mass units (mg or ug)
    if (doseQuantity.unit === "mg" || doseQuantity.unit === "ug") {
      return {
        value: dosesPerDay * doseQuantity.value,
        unit: doseQuantity.unit,
      };
    }

    // If doseQuantity is in actual volume units (mL)
    if (
      doseQuantity.unit === "mL" &&
      strength.unit &&
      strength.unit.indexOf("/mL") === strength.unit.length - 3
    ) {
      return {
        value: dosesPerDay * doseQuantity.value * strength.value,
        unit: strength.unit,
      };
    }

    // If doseQuantity is not in actual units (e.g., 1 tab, 1 spray)
    return {
      value: dosesPerDay * doseQuantity.value * strength.value,
      unit: strength.unit,
    };
  },

  /**
   * Builds a description for the daily dose for an ingredient
   */
  getDailyDoseDescription(
    ingredientCode,
    strength,
    doseFormCode,
    doseQuantity,
    dosesPerDay,
    dailyDose,
    supplyQuantity,
    supplyDuration
  ) {
    if (!ingredientCode || !doseFormCode || !doseQuantity) {
      return "";
    }

    const ingredientCodeInt = parseInt(ingredientCode.code);
    const doseFormCodeInt = parseInt(doseFormCode.code);
    const ingredientName = this.getIngredientName(ingredientCode);
    const doseFormName = this.getDoseFormName(doseFormCode);

    // If patch
    if (doseFormCodeInt === 316987) {
      if ([1819, 4337].includes(ingredientCodeInt)) {
        return `${ingredientName} patch: ${supplyQuantity} patches / ${supplyDuration} d * ${this.quantityToString(
          strength
        )} = ${this.quantityToString(dailyDose)}`;
      } else {
        console.error(
          `Unknown patch ingredient: ${ingredientCode.code}:${ingredientCode.display}`
        );
        return "";
      }
    }

    // If dose unit in actual mass units (mg or ug)
    if (doseQuantity.unit === "mg" || doseQuantity.unit === "ug") {
      return `${ingredientName} ${doseFormName}: ${dosesPerDay}/d * ${this.quantityToString(
        doseQuantity
      )} = ${this.quantityToString(dailyDose)}`;
    }

    // If doseQuantity in actual volume units (mL) or not in actual units
    return `${ingredientName} ${doseFormName}: ${dosesPerDay}/d * ${this.quantityToString(
      doseQuantity
    )} * ${this.quantityToString(strength)} = ${this.quantityToString(
      dailyDose
    )}`;
  },

  /**
   * Helper function to convert quantity to string
   */
  quantityToString(quantity) {
    if (!quantity) return "";
    if (quantity.unit) {
      return `${quantity.value} ${quantity.unit}`;
    }
    return quantity.value.toString();
  },

  /**
   * Calculates MMEs for the given medications
   */
  calculateMMEs(medications) {
    if (!medications || !Array.isArray(medications)) {
      return [];
    }

    const results = [];

    medications.forEach((med) => {
      const ingredients = this.getIngredients(med.rxNormCode);

      ingredients.forEach((ingredient) => {
        const adjustedDoseQuantity = this.ensureMicrogramQuantity(
          med.doseQuantity
        );
        const dailyDose = this.getDailyDose(
          ingredient.ingredientCode,
          ingredient.strength,
          ingredient.doseFormCode,
          adjustedDoseQuantity,
          med.dosesPerDay
        );

        const dailyDoseDescription = this.getDailyDoseDescription(
          ingredient.ingredientCode,
          ingredient.strength,
          ingredient.doseFormCode,
          adjustedDoseQuantity,
          med.dosesPerDay,
          dailyDose,
          med.supplyQuantity,
          med.supplyDuration
        );

        const factor = this.getConversionFactor(
          ingredient.ingredientCode,
          dailyDose,
          ingredient.doseFormCode
        );

        const mmeValue =
          dailyDose && factor !== null ? dailyDose.value * factor : null;

        results.push({
          rxNormCode: med.rxNormCode,
          doseFormCode: ingredient.doseFormCode,
          doseQuantity: adjustedDoseQuantity,
          dosesPerDay: med.dosesPerDay,
          ingredientCode: ingredient.ingredientCode,
          strength: ingredient.strength,
          dailyDose: dailyDose,
          dailyDoseDescription:
            dailyDoseDescription +
            (" * factor: " +
              (factor !== null
                ? factor.toString()
                : "No conversion factor available")),
          conversionFactor: factor,
          mme: mmeValue !== null ? { value: mmeValue, unit: "{MME}/d" } : null,
        });
      });
    });

    return results;
  },

  /**
   * Creates a quantity object
   */
  quantity(value, unit) {
    if (value !== null && value !== undefined) {
      if (unit) {
        return { value: value, unit: unit };
      }
      return { value: value };
    }
    return null;
  },
};

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = OMTKLogic;
}

/**
 * USAGE EXAMPLE:
 *
 * // First, provide the OMTKData object with DrugIngredients array
 * const OMTKData = {
 *   DrugIngredients: [
 *     {
 *       drugCode: 1234567,
 *       drugName: "Hydrocodone 5 MG Oral Tablet",
 *       doseFormCode: 316992,
 *       doseFormName: "Oral Tablet",
 *       ingredientCode: 5489,
 *       ingredientName: "Hydrocodone",
 *       strengthValue: 5,
 *       strengthUnit: "MG"
 *     },
 *     // ... more drug ingredients
 *   ]
 * };
 *
 * // Then calculate MMEs
 * const medications = [
 *   {
 *     rxNormCode: { code: "1234567", system: "http://www.nlm.nih.gov/research/umls/rxnorm" },
 *     doseQuantity: { value: 1, unit: "tablet" },
 *     dosesPerDay: 3,
 *     supplyQuantity: 90,
 *     supplyDuration: 30
 *   }
 * ];
 *
 * const mmeResults = OMTKLogic.calculateMMEs(medications);
 * console.log('MME Results:', mmeResults);
 */
