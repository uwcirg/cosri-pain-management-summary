library ReportLogicLibrary version '1.0.0'
using FHIR version '4.0.0'

// -----------------------------------------------------------------------------
// PATIENT INFORMATION
// -----------------------------------------------------------------------------
context Patient

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

define ProcedureHistory:
  ([Procedure] ProcList
    where ProcList.status.value = 'completed' and not (ReferralCodeList contains ConceptCode(ProcList.code))) P
    let performDate: (P.performed as FHIR.dateTime).value 
    return {
      Name: ConceptText(P.code),
      Date: performDate,
      DateText: DateTimeText(P.performed as FHIR.dateTime),
      CPT_CODE: ConceptCode(P.code)
    }
    sort by Date desc

define ReferralHistory:
  ([Procedure] ProcList
    where ProcList.status.value = 'completed' and (ReferralCodeList contains ConceptCode(ProcList.code))) P
    let performDate: (P.performed as FHIR.dateTime).value
    return {
      Name: ConceptText(P.code),
      Date: performDate,
      DateText: DateTimeText(P.performed as FHIR.dateTime),
      CPT_CODE: ConceptCode(P.code)
    }
    sort by Date desc

define MedicationList:
    [MedicationRequest] M
    // within 2 years
    //where ((year from Today() - year from M.authoredOn.value) <= 2)
    where M.authoredOn.value <= Today() and M.authoredOn.value >= (Today() - 2 year)
    return {
        Name:  ConceptText(M.medication as FHIR.CodeableConcept),
        Start: DateTimeText(M.authoredOn),
        Authored: M.authoredOn.value
    }
    sort by Authored

define Summary: {
  TreatmentHistory: {
    Procedures: ProcedureHistory,
    Referrals: ReferralHistory
  },
  MedicationList: MedicationList
}
