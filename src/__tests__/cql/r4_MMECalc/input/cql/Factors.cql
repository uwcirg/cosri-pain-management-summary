// # Introduction

// The Pain Management Summary artifact provides relevant information to consider when managing a patient’s pain.
// This CDS logic was informed by the Centers for Disease Control and Prevention (CDC) Guideline for Opioid Prescribing
// for Chronic Pain. The CDS is not a direct representation of any one recommendation statement within the guideline.
// Instead, the CDS compiles clinical concepts mentioned throughout the guideline in one consolidated summary for
// clinician review.
//
// In the process of authoring the logic, certain assumptions were made and details developed when the guideline did
// not provide enough specificity.  These decisions were made in the context of the CDS Connect Workgroup and CDC
// stakeholders, and are documented in the logic and/or in the CDS Connect artifact metadata.
//
// NOTE: This is a FHIR R4 port of the original FHIR DSTU2 CQL piloted for CDS Connect.  In addition to the changes
// to support FHIR R4, it contains the following additional changes from the artifact that was piloted:
// - Added the following value sets for identifying Risk Factors for Opiod-Related Harms (in addition to existing ones)
//   - Depression Diagnosis ICD9 (2.16.840.1.113883.3.600.143)
//   - Anxiety Disorders ICD9 (2.16.840.1.113883.3.1240.2017.3.2.1015)
//   - Substance Abuse (2.16.840.1.113883.3.464.1003.106.11.1010)
//   - Pregnancy (New ICD10 codes published in 2018 and 2019)": '2.16.840.1.113762.1.4.1032.80'
// - Changed the Suicide Attempt value set to 2.16.840.1.113762.1.4.1032.102
// - Removed specific inclusion of SNOMED-CT 86849004 since it is now in the Suicide Attempt value set
// - Added LOINC codes for the Pain intensity, Enjoyment of life, General activity scale [PEG]
//   - Previous local codes are still supported (but discouraged)
// - Added logic to normalize long LOINC display text for PEG codes to shorter names
// - Added LOINC code for the STarT Back Screening Tool
//   - Previous local code is still supported (but discouraged)
// - Added logic to display range for Opioid Risk Tool (ORT)
// - Updated QuantityText logic to not include '{score}' units (since scalar number is enough in those cases)
//
// ##Source guideline: [CDC Guideline for Opioid Prescribing for Chronic Pain](https://www.cdc.gov/drugoverdose/prescribing/guideline.html)
//
// Update 20200224
//    Removed inclusion criteria excepting age 18
//    Added opioid overdose for ICD-10 and SNOMED
//    Changed lookback for opioids, non-opioids, and benzos from 2 to 100 years
// Update 20200227
//    Added carisoprodol as another risk factor for co-prescribing with opioids
//    Also removed an old superfluous function
// Update 20200819
//    Updated to include MME Calculation

library Factors version '1.0.0'

// # Data model #

// The FHIR R4 model is used for testing purposes only.  It has not been piloted.
using FHIR version '4.0.0'

// # Referenced libraries #

// The CDS Connect Commons for FHIRv400 library provides functions representing commonly used CDS logic and patterns.
include CDS_Connect_Commons_for_FHIRv400 version '1.0.1' called C3F
// The FHIRHelpers library provides common functions for simplifying interaction w/ the FHIR R4 data model.
include FHIRHelpers version '4.0.0' called FHIRHelpers
// The MMECalculator library is used to compute the patient's MME/MED
include MMECalculator version '3.0.0' called MMECalculator

// # Value sets and codes #

// ## Code Systems ##

codesystem "LOINC": 'http://loinc.org'
codesystem "SNOMED-CT": 'http://snomed.info/sct'
codesystem "RxNorm": 'http://www.nlm.nih.gov/research/umls/rxnorm'

// Several concepts needed by the Pain Management Summary CDS do not yet have standardized codes associated with them.
// The CDS logic authors have registered new Logical Object Identifier Names and Codes (LOINC) codes, but they are
// not yet available.  Once available, the CDS will be updated.  Until then, CDS implementors will need to map to
// local codes (signified by the LOCAL code system below) or replace them with their own codes.
codesystem "LOCAL": 'http://cds.ahrq.gov/cdsconnect/pms'

// ## Value sets ##

// List value sets used by the artifact. The links to the Value Set Authority Center (VSAC) point to the latest
// expansion of each value set available.



// [See value set in VSAC](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1032.34/expansion)
//valueset "Opioid Pain Medications": '2.16.840.1.113762.1.4.1032.34'
code "Opioid Pain Medications": '197696' from "RxNorm"

// # Parameters #

// The InclusionMedicationsLookbackPeriod allows CDS implementors to specify how far the inclusion logic should look
// back for qualifying active medications. By default, the inclusion logic will look back 180 days.
parameter InclusionMedicationsLookbackPeriod default 180 days

// # CDS logic #

context Patient

// ## Re-usable functions ##

// The summary logic contains many constructs that are needed throughout the logic. Where possible, these constructs
// have been developed as re-usable functions that can be invoked wherever they are needed.

// Returns the first-found display text for a CodeableConcept, looking first at the `text` attribute, then the
// `display` on each `coding` until it finds a non-null value.  Some PEG codes are normalized due to length.
// @param c - a FHIR CodeableConcept to get text from
// @returns {System.String} the display text or null if none is found

define function ConceptText(c FHIR.CodeableConcept):
    Coalesce(c.text.value, Coalesce((c.coding) c2 return c2.display.value))

// Returns a text representation of a date using the CQL `ToString` function.
// @param d - a FHIR date to get text for
// @returns {System.String} the text representation of the date
define function DateText(d FHIR.date):
  ToString(d.value)

// Returns a text representation of a dateTime using the CQL `ToString` function.
// @param d - a FHIR dateTime to get text for
// @returns {System.String} the text representation of the dateTime
define function DateTimeText(d FHIR.dateTime):
  ToString(d.value)

// Returns a text representation of an instant using the CQL `ToString` function.
// @param i - a FHIR instant to get text for
// @returns {System.String} the text representation of the instant
define function InstantText(i FHIR.instant):
  ToString(i.value)

// Returns a text representation of a Quantity with the Quantity's value and unit.
// If the unit is {score}, then omit it (as it is not useful to display)
// @param q - a FHIR Quantity to get text for
// @returns {System.String} the text representation of the Quantity
define function QuantityText(q FHIR.Quantity):
  if (q is null) then null
  else if (q.unit is not null and q.unit.value != '{score}') then ToString(q.value.value) + ' ' + q.unit.value
  else if (q.code is not null and q.code.value != '{score}') then ToString(q.value.value) + ' ' + q.code.value
  else ToString(q.value.value)

// Returns a tuple containing a Period's start and end as text representations.
// @param p - a FHIR Period to get a tuple for
// @returns {Tuple<Start System.String, End System.String>} the tuple representation of the Period
define function PeriodObject(p FHIR.Period):
  if p is null then null
  else
    {
      Start: DateTimeText(p."start"),
      End: DateTimeText(p."end")
    }

// Returns a tuple containing a Range's low and high as text representations.
// @param r - a FHIR Range to get a tuple for
// @returns {Tuple<Low System.String, High System.String>} the tuple representation of the Range
define function RangeObject(r FHIR.Range):
  if r is null then null
  else
    {
      Low: QuantityText(r.low),
      High: QuantityText(r.high)
    }

// Returns a text representation of a date associated with an Observation, preferring `effectiveDateTime`, then
// `effectivePeriod.start`, then `issued`.
// @param o - a FHIR Observation to get the text date from
// @returns {System.String} the text representation of a relevant date from the Observation
define function ObservationDate(o FHIR.Observation):
  Coalesce(
    DateTimeText(o.effective as FHIR.dateTime),
    InstantText(o.effective as FHIR.instant),
    DateTimeText((o.effective as FHIR.Period)."start"),
    InstantText(o.issued)
  )

// Returns a text representation of a date associated with a MedicationStatement, preferring `effectiveDateTime`, then
// `.start`.
// @param s - a FHIR MedicationStatement to get the text date from
// @returns {System.String} the text representation of a relevant date from the MedicationStatement
define function MedicationStatementDate(s FHIR.MedicationStatement):
  Coalesce(
    DateTimeText(s.effective as FHIR.dateTime),
    DateTimeText((s.effective as FHIR.Period)."start")
  )

// Returns a text representation of a Condition's onset, whether represented as a dateTime, Period, Quantity (Age),
// Range (Age), or string.
// @param c - a FHIR Condition to get the text representation of the onset from
// @returns {System.String} the text representation of the Condition's onset
define function Onset(c FHIR.Condition):
  Coalesce( List{
    DateTimeText(c.onset as FHIR.dateTime),
    QuantityText(c.onset as FHIR.Age),
    PeriodObject(c.onset as FHIR.Period),
    RangeObject(c.onset as FHIR.Range),
    (c.onset as FHIR.string).value
  })

// Returns a text representation of a Condition's abatement, whether represented as a dateTime, Period, Quantity (Age),
// Range (Age), string, or boolean.
// @param c - a FHIR Condition to get the text representation of the abatement from
// @returns {System.String} the text representation of the Condition's abatement
define function Abatement(c FHIR.Condition):
  Coalesce( List{
    DateTimeText(c.abatement as FHIR.dateTime),
    QuantityText(c.abatement as FHIR.Age),
    PeriodObject(c.abatement as FHIR.Period),
    RangeObject(c.abatement as FHIR.Range),
    (c.abatement as FHIR.string).value
  })

// ## Target population ##

// INCLUSIONS

// Determines if patient's age, in years, at the time CQL is run, is at least 18 years old
define Is18orOlder:
  AgeInYears() >= 18

// Determines if the patient has any record of opioid pain medications in the lookback period
//       - Medication Request within past 180 days (lookback can be made a parameter)
//       - Medication Statement by patient within past 180 days (lookback can be made a parameter)
define HasRecentOpioidPainMedication:
  exists(C3F.ActiveCompletedOrStoppedMedicationRequest(C3F.MedicationRequestLookBack(
    [MedicationRequest: "Opioid Pain Medications"],
    InclusionMedicationsLookbackPeriod)
  ))
  or exists(C3F.ActiveOrCompletedMedicationStatement(C3F.MedicationStatementLookBack(
    [MedicationStatement: "Opioid Pain Medications"],
    InclusionMedicationsLookbackPeriod)
  ))


// Determines if the patient meets the inclusion criteria for the CDS. Inclusion criteria is:
// - Age >=18 years
// - AND
//   - OR Conditions associated with chronic pain
//   - OR Opioid pain medication
//   - OR Adjuvant analgesic medication
define MeetsInclusionCriteria:
  Is18orOlder

// REMOVING AHRQ APP INCLUSION CRITERIA FOR COSRI
//  and (
//    HasConditionAssociatedWithChronicPain
//    or HasRecentOpioidPainMedication
//    or HasRecentAdjuvantAnalgesicMedication
//  )



// EXCLUSIONS

// TAKE NOTICE: This CDS is not intended for patients who meet any of the following criteria:
// 1. Younger than 18 years of age
// 2. Undergoing end-of-life care (hospice or palliative)
// 3. Undergoing active cancer treatment
//
// The first exclusion is explicitly accounted for under INCLUSIONS.
// The second and third exclusions cannot be realiably detected for all patients using just EHR data. For that reason
// they are not implemented in this CDS. Care providers should use their judgement when applying this CDS to their
// patients.

// ## Intervention(s) ##

// DISPLAY and POPULATE a Pain Management Summary of the following items:

// PERTINENT MEDICAL HISTORY



// HISTORICAL TREATMENTS

// Opioid medication orders and statements with dates (lookback 2 years)

define OpioidMedicationRequests:
  C3F.ActiveCompletedOrStoppedMedicationRequest(C3F.MedicationRequestLookBack(
    [MedicationRequest: "Opioid Pain Medications"],
    100 years //changed from 2 to 100
  ))

define OpioidMedicationStatements:
  C3F.ActiveOrCompletedMedicationStatement(C3F.MedicationStatementLookBack(
    [MedicationStatement: "Opioid Pain Medications"],
    100 years //changed from 2 to 100
  ))

define ReportOpioidMedicationRequests:
  (OpioidMedicationRequests) O
  return {
    Type:  'Request',
    Name:  ConceptText(O.medication as FHIR.CodeableConcept),
    Start: DateTimeText(O.authoredOn),
    //provided by the extension dateValue, may not always be there
    End: DateText(O.dispenseRequest.extension[1].value),
    //End:   null as String, // MedicationRequest end date not supported in R4,
    //Amount: QuantityText(O.value as FHIR.Quantity),
    //provided by the extension valueString, may not always be there
    Quantity: QuantityText(O.dispenseRequest.quantity as FHIR.Quantity),
    Prescriber: O.requester.display.value,
    Pharmacy: (O.dispenseRequest.extension[0].value as FHIR.string).value,
    Status: O.status.value
  }
  sort by Start desc, End desc

define ReportOpioidMedicationStatements:
  (OpioidMedicationStatements) S
  return {
    Type:  'Statement',
    Name:  ConceptText(S.medication as FHIR.CodeableConcept),
    Start: MedicationStatementDate(S),
    End:   DateTimeText((S.effective as FHIR.Period)."end"),
    //Amount: QuantityText(S.value as FHIR.Quantity),
    Status: S.status.value
  }
  sort by Start desc, End desc

define ReportOpioidMedications:
  (ReportOpioidMedicationRequests union ReportOpioidMedicationStatements) M
  sort by Start desc, End desc


// RISK CONSIDERATIONS

//MME Calculation
define ActiveOpioidMedications:
  C3F.ActiveMedicationRequest([MedicationRequest: "Opioid Pain Medications"])

define CurrentMME:
  MMECalculator.TotalMME(ActiveOpioidMedications)

define ReportCurrentMME:
{
  if CurrentMME is null then
    null
  else
    (CurrentMME) M
    return {
      Name: 'Current Milligram Morephine Equivalent',
      Result: ToString(M),
      Date: ToString(Today())
    }
}


// SUMMARY

// The Summary object represents the full Pain Management Summary to be displayed to the clinician.  All values are
// returned as user-friendly text representations, but a robust user interface (UI) should be implemented to
// display the data to the user in a friendly manner.  See the Pain Management Summary SMART on FHIR application as
// an example of how to integrate this summary into an EHR using modern web UI technologies.

define Summary: {
  Patient: {
    Name: Combine(Patient.name.given G return G.value, ' ') + ' ' + Combine(Patient.name.family F return F.value, ' '),
    Gender: Patient.gender.value,
    Age: AgeInYears(),
    MeetsInclusionCriteria: MeetsInclusionCriteria
  },
  HistoricalTreatments: {
    OpioidMedications: ReportOpioidMedications
  },
  RiskConsiderations: {
    CurrentMME: ReportCurrentMME
  }
}
