library BodyDiagramLogicLibrary version '1.0.0'
using FHIR version '4.0.0'
include "FHIRHelpers" version '4.0.0' called FHIRHelpers
include "Common_LogicLibrary" version '1.0.0' called LogicHelper

parameter dataKey default 'paintracker-location-body-diagram'
parameter id default 'CIRG-PainTracker-Location-Body-Diagram'
define QuestionnaireID:
  id
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

define QuestionnaireKey:
  dataKey

define QuestionnaireShortName: 
  'body-diagram'

// Load Questionnaire
define Questionnaire:
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireID, 'body'))

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], Questionnaire)

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
      qid: QuestionnaireKey,
      date: LogicHelper.DateTimeText(I.authored),
      painLocations: painLocations(I.item),
      severePainLocation: severePainLocation(I.item),
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    