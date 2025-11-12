import OMTKLogic from "./OMTKLogic";
/**
 * MME Calculator - JavaScript Implementation, see original CQL in ./src/cql/MMECalculator.cql
 * direct translation from CQL to Javascript, updated syntax as needed
 * This library calculates Milligram Morphine Equivalent (MME) from FHIR R4 MedicationRequest object.
 * Example FHIR object structure:
 * {
    "identifier": [
        {
            "system": {
                "value": "https://github.com/uwcirg/script-fhir-facade/"
            }
        }
    ],
    "medication": {
        "coding": [
            {
                "system": {
                    "value": "http://hl7.org/fhir/sid/ndc"
                },
                "code": {
                    "value": "55700036760"
                },
                "display": {
                    "value": "MS Cotin 30 MG Oral Tablet"
                }
            },
            {
                "system": {
                    "value": "http://www.nlm.nih.gov/research/umls/rxnorm"
                },
                "code": {
                    "value": "891888"
                },
                "display": {
                    "value": "MS Cotin 30 MG Oral Tablet"
                }
            }
        ],
        "text": {
            "value": "MS Cotin 30 MG Oral Tablet"
        },
        "extension": [
            {
                "url": {
                    "value": "http://cosri.org/fhir/drug_class"
                },
                "value": {
                    "value": "opioid"
                }
            }
        ]
    },
    "subject": {
        "reference": {
            "value": "Patient/5ee05359-57bf-4cee-8e89-91382c07e162"
        }
    },
    "authoredOn": {
        "value": "2025-05-10"
    },
    "requester": {
        "display": {
            "value": "Domita Calvilla"
        }
    },
    "dispenseRequest": {
        "quantity": {
            "value": {
                "value": 60
            }
        },
        "expectedSupplyDuration": {
            "value": {
                "value": 30
            },
            "unit": {
                "value": "days"
            },
            "system": {
                "value": "http://unitsofmeasure.org"
            },
            "code": {
                "value": "d"
            }
        },
        "extension": [
            {
                "url": {
                    "value": "http://cosri.org/fhir/pharmacy_name"
                },
                "value": {
                    "value": "Nerva Pharmacy"
                }
            },
            {
                "url": {
                    "value": "http://cosri.org/fhir/last_fill"
                },
                "value": {
                    "value": "2025-05-10"
                }
            }
        ]
    },
    "id": {
        "value": "3205257"
    },
    "meta": {
        "versionId": {
            "value": "1"
        },
        "lastUpdated": {
            "value": "2025-11-10T11:45:08.643-05:00"
        }
    }
}
 */

const MMECalculator = {
  ErrorLevel: "Warning",

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
   * Helper function to extract FHIR Range value
   */
  toFHIRRange(range) {
    return range;
  },

  /**
   * Helper function to extract FHIR SimpleQuantity value
   */
  toFHIRQuantity(quantity) {
    return quantity;
  },

  /**
   * Helper function to extract FHIR CodeableConcept value
   */
  toFHIRCodeableConcept(codeableConcept) {
    return codeableConcept;
  },

  /**
   * Converts FHIR SimpleQuantity to System Quantity
   * Uses the code element rather than unit element as per spec
   */
  toQuantity(quantity) {
    if (!quantity) return null;

    const value = this.extractValue(quantity.value);
    const code = this.extractValue(quantity.code);
    const system = this.extractValue(quantity.system);

    if (!value) return null;

    if (!system || system === "http://unitsofmeasure.org") {
      return {
        value: value,
        unit: code,
      };
    } else {
      console.error(`Invalid FHIR Quantity code: ${code}`);
      return null;
    }
  },

  /**
   * Gets the first non-null value from the arguments
   */
  coalesce(...args) {
    return args.find((arg) => arg !== null && arg !== undefined);
  },

  /**
   * Extracts medication quantity from a MedicationRequest
   */
  getMedicationQuantity(medication) {
    const rxNormCode = OMTKLogic.getMedicationCode(medication.medication);

    if (!rxNormCode) {
      console.warn("No RxNorm code found for medication");
      return null;
    }

    const ingredients = OMTKLogic.getIngredients(rxNormCode);
    const prescription =
      ingredients && ingredients.length > 0 ? ingredients[0] : null;

    const dosageInstruction = medication.dosageInstruction?.[0];
    const doseAndRate = dosageInstruction?.doseAndRate?.[0];
    const dosage = doseAndRate?.dose;

    // Check if dosage is a Range type
    const doseRange = dosage && dosage.high !== undefined ? dosage : null;

    // Calculate dose quantity
    let doseQuantity;
    if (dosage && !dosage.high) {
      // Single quantity dose - extract the actual unit from the dosage
      const doseValue = this.extractValue(dosage.value);
      const doseUnit = this.extractValue(dosage.unit);
      doseQuantity = {
        value: doseValue,
        unit: doseUnit,
      };
    } else {
      // Default to 1.0 unit (e.g., one tablet, one patch)
      // IMPORTANT: Do NOT set unit here - let it be null
      // This tells getDailyDose to multiply by strength
      doseQuantity = {
        value: 1.0,
        unit: null,
      };
    }

    // Return the appropriate dose
    if (doseRange && doseRange.high) {
      return this.toQuantity(doseRange.high);
    } else if (doseQuantity) {
      return doseQuantity;
    }

    return null;
  },

  /**
   * Extracts prescription information from MedicationRequest resources
   */
  prescriptions(orders) {
    if (!orders || !Array.isArray(orders)) {
      return [];
    }

    return orders
      .map((order) => {
        const rxNormCode = OMTKLogic.getMedicationCode(order.medication);

        if (!rxNormCode) {
          console.warn(
            "Could not extract RxNorm code from medication:",
            order.medication
          );
          return null;
        }

        const prescription = OMTKLogic.getIngredients(rxNormCode);
        const medicationName = OMTKLogic.getMedicationName(rxNormCode);

        const dosageInstruction = order.dosageInstruction?.[0];
        const doseAndRate = dosageInstruction?.doseAndRate?.[0];
        const repeat = dosageInstruction?.timing?.repeat;

        const frequencyMax = this.extractValue(repeat?.frequencyMax);
        const frequency = this.extractValue(repeat?.frequency);
        const frequencyValue = this.coalesce(frequencyMax, frequency);

        const dispenseRequest = order.dispenseRequest;

        let supplyDuration = null;
        if (dispenseRequest?.expectedSupplyDuration) {
          const durationValue = this.extractValue(
            dispenseRequest.expectedSupplyDuration.value
          );
          const durationUnit = this.extractValue(
            dispenseRequest.expectedSupplyDuration.unit
          );
          supplyDuration = {
            value: durationValue,
            unit: durationUnit,
          };
        }

        const dispenseQuantityValue = this.extractValue(
          dispenseRequest?.quantity?.value
        );
        const periodValue = this.extractValue(repeat?.period);
        const periodUnit = this.extractValue(repeat?.periodUnit);
        const period = periodValue
          ? OMTKLogic.quantity(periodValue, periodUnit)
          : null;

        const doseRange = this.toFHIRRange(doseAndRate?.dose);
        const doseQuantity = doseAndRate?.dose
          ? this.toFHIRQuantity(doseAndRate.dose)
          : null;

        const supplyQuantity = dispenseQuantityValue;
        const supplyDurationValue = this.extractValue(
          dispenseRequest?.expectedSupplyDuration?.value
        );

        // Build dose description
        let doseDescription = "";
        if (doseRange && doseRange.low && doseRange.high) {
          const lowVal = this.extractValue(doseRange.low.value);
          const highVal = this.extractValue(doseRange.high.value);
          const highUnit = this.extractValue(doseRange.high.unit);
          doseDescription = `${lowVal}-${highVal}${highUnit || ""}`;
        } else if (doseQuantity) {
          const qty = this.toQuantity(doseQuantity);
          doseDescription = qty ? `${qty.value} ${qty.unit || ""}` : "";
        }

        // Build frequency description
        const freqValue = this.extractValue(
          dosageInstruction?.timing?.repeat?.frequency
        );
        const freqMaxValue = this.extractValue(
          dosageInstruction?.timing?.repeat?.frequencyMax
        );
        const frequencyDescription = `${freqValue || ""}${
          freqMaxValue ? "-" + freqMaxValue : ""
        }`;

        // Build prescription string
        let prescriptionText;
        const dosageText = this.extractValue(dosageInstruction?.text);
        if (dosageText) {
          prescriptionText = `${medicationName} ${dosageText}`;
        } else {
          const asNeeded = this.extractValue(dosageInstruction?.asNeeded);
          const prnText = asNeeded ? " PRN" : "";
          prescriptionText = `${medicationName} ${doseDescription} q${frequencyDescription}${prnText}`;
        }

        // Calculate doses per day
        let dosesPerDay = null;
        if (frequencyValue && period) {
          dosesPerDay = this.coalesce(
            OMTKLogic.toDaily(frequencyValue, period),
            1.0
          );
        } else if (
          supplyDurationValue &&
          supplyDurationValue !== 0 &&
          supplyQuantity
        ) {
          // Use supply quantity / supply duration as fallback
          dosesPerDay = supplyQuantity / supplyDurationValue;
        }

        const orderStatus = this.extractValue(order.status);
        const asNeeded = this.extractValue(dosageInstruction?.asNeeded);

        return {
          rxNormCode: rxNormCode,
          authoredOn: this.extractValue(order.authoredOn),
          isDraft: orderStatus === "draft",
          isPRN: asNeeded || false,
          prescription: prescriptionText,
          dose: this.getMedicationQuantity(order),
          doseRange: doseRange,
          doseQuantity: doseAndRate?.dose,
          dosesPerDay: dosesPerDay,
          strength: prescription?.[0]?.strength,
          supplyQuantity: supplyQuantity,
          supplyDuration: supplyDurationValue,
        };
      })
      .filter((p) => p !== null); // Filter out any null results
  },

  /**
   * Calculates MME for each medication in the list
   */
  mme(prescriptions) {
    if (!prescriptions || !Array.isArray(prescriptions)) {
      return [];
    }

    const prescriptionData = this.prescriptions(prescriptions);

    return prescriptionData.map((p) => {
      const mmePerIngredient = OMTKLogic.calculateMMEs([
        {
          rxNormCode: p.rxNormCode,
          doseQuantity: p.dose,
          dosesPerDay: p.dosesPerDay,
          supplyQuantity: p.supplyQuantity,
          supplyDuration: p.supplyDuration,
        },
      ]);

      const dailyDose = mmePerIngredient
        .map((x) => x.dailyDoseDescription)
        .filter(Boolean)
        .join("\r\n");

      const totalMME = (
        mmePerIngredient.reduce((sum, x) => sum + (x.mme?.value || 0), 0)
      );

      return {
        rxNormCode: p.rxNormCode,
        isDraft: p.isDraft,
        isPRN: p.isPRN,
        prescription: p.prescription,
        doseQuantity: p.dose,
        dosesPerDay: p.dosesPerDay,
        dailyDose: dailyDose,
        conversionFactor: mmePerIngredient[0]?.conversionFactor,
        strength: p.strength,
        supplyQuantity: p.supplyQuantity,
        supplyDuration: p.supplyDuration,
        mme: totalMME,
      };
    });
  },

  /**
   * Calculates total MME for all medications
   */
  totalMME(prescriptions) {
    const mmeResults = this.mme(prescriptions);
    const total = mmeResults.reduce((sum, m) => sum + (m.mme || 0), 0);

    return OMTKLogic.quantity(total, "mg/d");
  },
};

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = MMECalculator;
}

/**
 * USAGE EXAMPLE:
 *
 * // A list of MedicationRequest FHIR Objects
 * const medObjects = [...];
 *
 * // Calculate MME for each prescription
 * const mmeResults = MMECalculator.mme(medObjects);
 * console.log('Individual MME results:', mmeResults);
 *
 * // Calculate total MME
 * const totalMME = MMECalculator.totalMME(medObjects);
 * console.log('Total MME:', totalMME);
 */
