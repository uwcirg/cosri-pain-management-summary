library StopLogicLibrary version '1.0.0'
using FHIR version '4.0.0'
include "FHIRHelpers" version '4.0.0' called FHIRHelpers
include "Common_LogicLibrary" version '1.0.0' called LogicHelper

parameter dataKey default 'paintracker-ge'
parameter id default 'CIRG-PainTracker-GE'

define QuestionnaireID:
  id
define QuestionnaireShortName: 'paintracker-ge'
define question1LinkId: 'GE-1-1'
define question2LinkId: 'GE-1-2'
define question3LinkId: 'GE-1-3'
define extensionAnswerIndex: 0
define QuestionnaireKey:
  dataKey

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

define ReportOnce:
  true

define ExcludeFromScoring:
  true

define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    responsesOnly: ((LogicHelper.FormattedQuestionnaireResponses(I.item)) a where a.linkId = question1LinkId or a.linkId = question2LinkId or a.linkId = question3LinkId)
    return Tuple {
      id: I.id.value,
      qid: QuestionnaireKey,
      date: LogicHelper.DateTimeText(I.authored),
      items: I.item,
      responses: responsesOnly,
      questionnaireItems: QuestionnaireItems,
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    