library MMECalculator version '3.0.0'

/*
This library contains logic to surface the MME calculation functionality provided
by the OMTKLogic library by extracting appropriate information from FHIR R4
MedicationRequest resource.
*/
/*
 CHANGE LOG
 08/06/2021
    provide 1.0 as the default dose quantity if doseQuantity is missing from Medication Request
    provide (supplyQuantity / supplyDuration) calculation as default doses per day if frequency & period is missing from Medication Request
*/

using FHIR version '4.0.0'

include FHIRHelpers version '4.0.0'
include OMTKLogic version '3.0.0'

parameter ErrorLevel String default 'Warning'

context Patient

/*
Helper function to force the choice of the FHIR.Range value.
This avoids the need for the _is_ and _as_ operators on choices,
which is not implemented in the JavaScript CQL engine.
*/
define function ToFHIRRange(range FHIR.Range):
  range

/*
Helper function to force the choice of the FHIR.SimpleQuantity value.
This avoids the need for the _is_ and _as_ operators on choices,
which is not implemented in the JavaScript CQL engine.
*/
define function ToFHIRQuantity(quantity FHIR.Quantity):
  quantity

/*
Helper function to force the choice of the FHIR.CodeableConcept value.
This avoids the need for the _is_ and _as_ operators on choices,
which is not implemented in the JavaScript CQL engine.
*/
define function ToFHIRCodeableConcept(codeableConcept FHIR.CodeableConcept):
  codeableConcept

/*
FHIRHelpers ToQuantity logic incorrectly uses the unit element of the FHIR Quantity,
when it should be using the code element as the actual coded unit.
https://github.com/cqframework/clinical_quality_language/issues/557

Until the above issue is addressed, this function provides ToQuantity functionality for this library
*/
define function ToQuantity(quantity FHIR.Quantity):
  case
    when quantity is null then null
    when quantity.value is null then null
    when quantity.system is null or quantity.system = 'http://unitsofmeasure.org' then
      System.Quantity {
        value: quantity.value.value,
        unit: quantity.code.value
      }
    else
      Message(null, true, 'MMECalculator.ToQuantity.InvalidFHIRQuantity', ErrorLevel, 'Invalid FHIR Quantity code: ' & quantity.code.value)
  end

define function GetMedicationQuantity(medication MedicationRequest):
  medication O
    let
      rxNormCode: OMTKLogic.GetMedicationCode(O.medication),
      ingredient: OMTKLogic.GetIngredients(rxNormCode),
      prescription: if ingredient is not null then First(ingredient) else null,
      dosageInstruction: O.dosageInstruction[0],
      doseAndRate:  if dosageInstruction is not null then dosageInstruction.doseAndRate[0] else null, //either a single doseRange or doseQuantity see specs here:  https://www.hl7.org/fhir/dosage-definitions.html#Dosage.doseAndRate.dose_x_
      dosage: if doseAndRate is not null then doseAndRate.dose else null,
      doseRange: if dosage is not null then ToFHIRRange(dosage) else null as Range,
      doseUnit: if prescription is not null and prescription.strength is not null
                and prescription.strength.unit is not null
                then OMTKLogic.ToUCUM(prescription.strength.unit) else null,
      doseQuantity:
              case
                //look for dosage instruction first
                when dosage is not null and dosage.high is null then
                  System.Quantity {
                      value: dosage.value.value,
                      unit: doseUnit
                  }
                //see FHIR dose definition:  https://www.hl7.org/fhir/dosage-definitions.html#Dosage.doseAndRate.dose_x_
                //expect minium value of 0 to maximum value of 1
                //example: if one wants to communicate that a tablet was 375 mg, the dose would be one tablet
                else System.Quantity {
                  value: 1.0,
                  unit: doseUnit
                }
              end
      return  case
                when doseRange is not null and doseRange.high is not null then ToQuantity(doseRange.high)
                when doseQuantity is not null then doseQuantity
                else null as System.Quantity
              end
/*
Extracts the relevant information for prescription calculation from a list of
FHIR MedicationRequest resources.
*/
define function Prescriptions(Orders List<MedicationRequest>):
  Orders O
    let
      // NOTE: Assuming medication is specified as a CodeableConcept with a single RxNorm code
      rxNormCode: OMTKLogic.GetMedicationCode(O.medication),
      prescription: OMTKLogic.GetIngredients(rxNormCode),
      medicationName: OMTKLogic.GetMedicationName(rxNormCode),
      // NOTE: Assuming a single dosage instruction element
      dosageInstruction: O.dosageInstruction[0],
      // NOTE: Assuming a single dose and rate element
      doseAndRate: dosageInstruction.doseAndRate[0],
      repeat: dosageInstruction.timing.repeat,
      frequency: Coalesce(repeat.frequencyMax.value, repeat.frequency.value),
      dispenseRequest: O.dispenseRequest,
      supplyDuration: if dispenseRequest.expectedSupplyDuration is not null then System.Quantity {
        value: dispenseRequest.expectedSupplyDuration.value,
        unit: dispenseRequest.expectedSupplyDuration.unit
      } else null as System.Quantity,
      dispenseRequestQuantity: dispenseRequest.quantity.value.value,
      periodDuration: if repeat.period is not null then
        repeat.period.value else null,
      period: OMTKLogic.Quantity(periodDuration, repeat.periodUnit.value),
      doseRange: ToFHIRRange(doseAndRate.dose),
      doseQuantity: if doseAndRate.dose is not null then ToFHIRQuantity(doseAndRate.dose) else null as Quantity,
      supplyQuantity: dispenseRequest.quantity.value.value,
      supplyDuration: dispenseRequest.expectedSupplyDuration.value.value,
      doseDescription:
        Coalesce(
          // There should be a conversion from FHIR.SimpleQuantity to System.Quantity
          if doseRange is not null
            then ToString(doseRange.low)
                + '-' + ToString(doseRange.high)
                + doseRange.high.unit.value
            else ToString(ToQuantity(doseQuantity)),
            ''
        ),
      frequencyDescription:
        ToString(dosageInstruction.timing.repeat.frequency.value) +
          Coalesce(
            '-' + ToString(dosageInstruction.timing.repeat.frequencyMax.value),
            ''
          )
    return {
      rxNormCode: rxNormCode,
      authoredOn: O.authoredOn,
      isDraft: O.status.value = 'draft',
      // NOTE: Assuming asNeeded is expressed as a boolean
      isPRN: dosageInstruction.asNeeded,
      prescription:
        if dosageInstruction.text is not null then
          medicationName + ' ' + dosageInstruction.text.value
        else
          // TODO: Shouldn't need the .value here on asNeededBoolean
          medicationName + ' ' + doseDescription + ' q' + frequencyDescription + (if dosageInstruction.asNeeded then ' PRN' else ''),
      dose: GetMedicationQuantity(O),
      doseRange: doseRange,
      doseQuantity: doseAndRate.dose,
      dosesPerDay:
        if frequency is not null and period is not null then
          Coalesce(OMTKLogic.ToDaily(frequency, period), 1.0)
        else
          //see CDC explanation of how doses per day is determine: https://www.cdc.gov/drugoverdose/training/dosing/accessible/index.html
          if supplyDuration is not null and supplyQuantity is not null then
            (supplyQuantity / supplyDuration)
          else
            null,
      strength: prescription.strength,
      supplyQuantity: supplyQuantity,
      supplyDuration: supplyDuration
    }

/*
Calculates Milligram Morphine Equivalent (MME) for each medication in the given
list. The calculation assumes the most aggresive dosing, and is performed for all
medications in the given list (i.e. no additional filtering for status is performed).
*/
define function MME(prescriptions List<MedicationRequest>):
  (Prescriptions(prescriptions)) P
    let mmePerIngredient: OMTKLogic.CalculateMMEs({ { rxNormCode: P.rxNormCode, doseQuantity: P.dose, dosesPerDay: P.dosesPerDay, supplyQuantity: P.supplyQuantity, supplyDuration: P.supplyDuration} })
    return {
      rxNormCode: P.rxNormCode,
      isDraft: P.isDraft,
      isPRN: P.isPRN,
      prescription: P.prescription,
      doseQuantity: P.dose,
      dosesPerDay: P.dosesPerDay,
      dailyDose: Combine(mmePerIngredient X return X.dailyDoseDescription, '\r\n'),
      conversionFactor: mmePerIngredient.conversionFactor,
      strength: P.strength,
      supplyQuantity: P.supplyQuantity,
      supplyDuration: P.supplyDuration,
      mme: Sum(mmePerIngredient X return X.mme)
    }

/*
Calculates total Milligram Morphine Equivalent (MME) for the given list of medications.
The calculation assumes the most aggressive dosing, and is performed for all
medications in the given list (i.e. no additional filtering for status is performed).
*/
define function TotalMME(prescriptions List<MedicationRequest>):
  OMTKLogic.Quantity(
    Sum((MME(prescriptions)) M return M.mme.value),
    'mg/d'
  )
