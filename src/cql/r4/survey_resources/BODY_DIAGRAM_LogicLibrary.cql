library BodyDiagramLogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'


define QuestionnaireName: 'body_diagram'
define QuestionnaireURL: 'http://www.cdc.gov/ncbddd/fasd/body_diagram'
define PainLocationsQuestionLinkId: 'CIRG-PainTracker-1252'
define SeverePainLocationQuestionLinkId: 'CIRG-PainTracker-1253'
define ExcludeFromScoring: true

// -----------------------------------------------------------------------------
// PATIENT INFORMATION
// -----------------------------------------------------------------------------
context Patient


//------------------------------------------------------------------------------
// QUESTIONNAIRE AND QUESTIONNAIRERESPONSE LOGIC
//------------------------------------------------------------------------------

// Load Questionnaire
define BodyDiagramQuestionnaire:
  First(LogicHelper.GetMatchQuestionnaire(null, QuestionnaireName, QuestionnaireURL))

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], BodyDiagramQuestionnaire, 'Body-Diagram')

define function painLocationAnswerItem (responseItems List<FHIR.QuestionnaireResponse.Item>):
  First(LogicHelper.GetArrayAnswerByLinkId(PainLocationsQuestionLinkId, responseItems))

define function severePainLocationAnswerItem (responseItems List<FHIR.QuestionnaireResponse.Item>): 
  First(LogicHelper.GetArrayAnswerByLinkId(SeverePainLocationQuestionLinkId, responseItems))

define function painLocations(responseItems List<FHIR.QuestionnaireResponse.Item>):
    (painLocationAnswerItem(responseItems)) I 
    return I.value.display.value 

define function severePainLocation(responseItems List<FHIR.QuestionnaireResponse.Item>):
    (severePainLocationAnswerItem(responseItems)) I 
    return I.value.display.value
     
define ResponsesSummary:
  (QuestionnaireResponses) I
    return Tuple {
      id: I.id.value,
      qid: QuestionnaireName,
      date: LogicHelper.DateTimeText(I.authored),
      painLocations: painLocations(I.item),
      severePainLocation: severePainLocation(I.item),
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    