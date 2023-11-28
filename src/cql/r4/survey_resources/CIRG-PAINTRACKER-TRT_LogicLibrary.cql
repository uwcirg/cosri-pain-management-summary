library TrtLogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'

define QuestionnaireID: 'CIRG-PainTracker-TRT'
define QuestionnaireName: 'trt'
define ExcludeFromScoring: true

// -----------------------------------------------------------------------------
// PATIENT INFORMATION
// -----------------------------------------------------------------------------
context Patient


//------------------------------------------------------------------------------
// QUESTIONNAIRE AND QUESTIONNAIRERESPONSE LOGIC
//------------------------------------------------------------------------------

// Load Questionnaire
define Questionnaire:
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireID, QuestionnaireName, null))

define QuestionnaireItems:
  (Questionnaire) Q 
  return Q.item

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], Questionnaire, QuestionnaireName)

define ResponsesSummary:
  (QuestionnaireResponses) I
    return Tuple {
      id: I.id.value,
      qid: QuestionnaireName,
      date: LogicHelper.DateTimeText(I.authored),
      items: I.item,
      responses: LogicHelper.FormattedQuestionnaireResponses(I.item),
      questionnaireItems: QuestionnaireItems,
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    