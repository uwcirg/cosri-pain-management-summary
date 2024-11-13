library ReportLogicLibrary version '1.0.0'
using FHIR version '4.0.0'
// The FHIRHelpers library provides common functions for simplifying interaction w/ the FHIR R4 data model.
include FHIRHelpers version '4.0.0' called FHIRHelpers

// -----------------------------------------------------------------------------
// PATIENT INFORMATION
// -----------------------------------------------------------------------------
context Patient

//system url identifier used to identify resources, e.g. MedicationRequest, from PDMP
define UWMC_SYSTEM_VALUE: 'http://www.uwmedicine.org/medication_id'
// ## Re-usable functions ##

// Returns the first-found display text for a CodeableConcept, looking first at the `text` attribute, then the
// `display` on each `coding` until it finds a non-null value.  Some PEG codes are normalized due to length.
// @param c - a FHIR CodeableConcept to get text from
// @returns {System.String} the display text or null if none is found
define function ConceptText(c FHIR.CodeableConcept):
    Coalesce(c.text.value, Coalesce((c.coding) c2 return c2.display.value))


// Returns code for a CodeableConcept
// @param c - a FHIR CodeableConcept to get code from
// @returns {System.String} the code text or null if none is found
define function ConceptCode(c FHIR.CodeableConcept):
  Coalesce((c.coding) c2 return c2.code.value)

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

define ReferralCodeList: {
  '1009020',
  '1009077',
  '1009065',
  '1009019',
  '1009032'
}

//------------------------------------------------------------------------------
// REPORT LOGIC, e.g. Procedure, Condition, ServiceRequest
//------------------------------------------------------------------------------

define function GetEncounterLocation(enc_id String):
  First(([Encounter] E where E.id = enc_id) P return P.location.location.display.value)

define ProcedureHistory:
  ([Procedure] ProcList
    where ProcList.status.value = 'completed' and not (ReferralCodeList contains ConceptCode(ProcList.code))) P
    let 
      performDate: (P.performed as FHIR.dateTime).value,
      encounterReference: if P.encounter is not null and P.encounter.reference is not null then P.encounter.reference.value else null
    return {
      Name: ConceptText(P.code),
      Date: performDate,
      DateText: DateTimeText(P.performed as FHIR.dateTime),
      Location: if encounterReference is not null then GetEncounterLocation(Split(encounterReference, '/')[1]) else null,
      CPT_CODE: ConceptCode(P.code)
    }
    sort by Date desc

define ReferralHistory:
  ([Procedure] ProcList
    where ProcList.status.value = 'completed' and (ReferralCodeList contains ConceptCode(ProcList.code))) P
    let 
      performDate: (P.performed as FHIR.dateTime).value,
      encounterReference: if P.encounter is not null and P.encounter.reference is not null then P.encounter.reference.value else null
    return {
      Name: ConceptText(P.code),
      Date: performDate,
      DateText: DateTimeText(P.performed as FHIR.dateTime),
      Location: if encounterReference is not null then GetEncounterLocation(Split(encounterReference, '/')[1]) else null,
      CPT_CODE: ConceptCode(P.code)
    }
    sort by Date desc

define MedicationList:
    [MedicationRequest] M
    // within 2 years
    where M.identifier[0].system = UWMC_SYSTEM_VALUE
          and M.authoredOn.value <= Today() 
          and M.authoredOn.value >= (Today() - 2 year)
    return {
        Name:  ConceptText(M.medication as FHIR.CodeableConcept),
        Start: DateTimeText(M.authoredOn),
        Dosage: M.dosageInstruction.text.value,
        Quantity: if M.dispenseRequest is not null and M.dispenseRequest.quantity is not null then M.dispenseRequest.quantity.value.value else null,
        Prescriber: M.requester.display.value,
        Authored: M.authoredOn.value
    }
    sort by Authored desc

define Summary: {
  TreatmentHistory: {
    Procedures: ProcedureHistory,
    Referrals: ReferralHistory
  },
  MedicationList: MedicationList
}
