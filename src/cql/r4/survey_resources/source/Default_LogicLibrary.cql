library DefaultLogicLibrary version '1.0.0'
<<<<<<< HEAD
using FHIR version '4.0.1'
include "FHIRHelpers" version '4.0.1' called FHIRHelpers
=======
using FHIR version '4.0.0'
include "FHIRHelpers" version '4.0.0' called FHIRHelpers
>>>>>>> 83eac68f53639a94e5c72320d14369805ebe59f3
include "Common_LogicLibrary" version '1.0.0' called LogicHelper

parameter dataKey default ''
parameter id default ''
parameter excludeFromScoring default true
parameter reportOnce default true

define QuestionnaireID:
  id
define QuestionnaireShortName:
  dataKey

define QuestionnaireKey:
  dataKey

define ExcludeFromScoring:
  excludeFromScoring

define ReportOnce:
  reportOnce
// -----------------------------------------------------------------------------
// PATIENT INFORMATION
// -----------------------------------------------------------------------------
context Patient

//------------------------------------------------------------------------------
// QUESTIONNAIRE AND QUESTIONNAIRERESPONSE LOGIC
//------------------------------------------------------------------------------

// Load Questionnaire
define Questionnaire:
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireID, QuestionnaireKey))

define QuestionnaireItems:
  (Questionnaire) Q 
  return Q.item

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], Questionnaire)

define ResponsesSummary:
  (QuestionnaireResponses) I
    return Tuple {
      id: I.id.value,
      qid: QuestionnaireKey,
      date: LogicHelper.DateTimeText(I.authored),
      items: I.item,
      responses: LogicHelper.FormattedQuestionnaireResponses(I.item),
      questionnaireItems: QuestionnaireItems,
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    