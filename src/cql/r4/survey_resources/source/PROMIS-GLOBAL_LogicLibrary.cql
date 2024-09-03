library PromisGlobalLogicLibrary version '1.0.0'
<<<<<<< HEAD
<<<<<<< HEAD
using FHIR version '4.0.1'
include "FHIRHelpers" version '4.0.1' called FHIRHelpers
=======
using FHIR version '4.0.0'
include "FHIRHelpers" version '4.0.0' called FHIRHelpers
>>>>>>> 62dc10adb005321bcdbe6d0d26853a9d31e5c61a
=======
using FHIR version '4.0.0'
include "FHIRHelpers" version '4.0.0' called FHIRHelpers
>>>>>>> 83eac68f53639a94e5c72320d14369805ebe59f3
include "Common_LogicLibrary" version '1.0.0' called LogicHelper

parameter dataKey default 'promis-global'
parameter id default 'CIRG-PROMIS-GLOBAL'

define QuestionnaireID:
  id
define QuestionnaireShortName: 'promis'
define question1LinkId: '/61577-3'
define question2LinkId: '/61578-1'
define question3LinkId: '/61579-9'
define question4LinkId: '/61580-7'
define question5LinkId: '/61581-5'
define question6LinkId: '/61585-6'
define question7LinkId: '/61582-3'
define question8LinkId: '/61586-4'
define question9LinkId: '/61584-9'
define question10LinkId: '/61583-1'
define ScoringQuestionId: '/85523-9'
define extensionAnswerIndex: 0
define ScoreParams: Tuple {
  minScore: 0,
  maxScore: 100
}
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

define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    scoreQuestionResponse: First(LogicHelper.GetNumericValueByResponseItem(I.item, ScoringQuestionId)),
    itemTotalScore:
          case
            when scoreQuestionResponse is not null then scoreQuestionResponse
            else
              null // logic is complex see here https://docs.google.com/document/d/1HOYjVsiMl41eaU9Ph_q9aHBwcf97VmuoZORpiyihLio/edit#heading=h.86yqk2icwlwn
          end,
    
    score: itemTotalScore,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item),
    totalItems: 10
    return Tuple {
      id: I.id.value,
      qid: QuestionnaireKey,
      date: LogicHelper.DateTimeText(I.authored),
      items: I.item,
      responses: responsesOnly,
      scoringQuestionResponse: scoreQuestionResponse,
      score: score,
      minScore: ScoreParams.minScore,
      maxScore: ScoreParams.maxScore,
     totalAnsweredItems: Min({
        LogicHelper.GetTotalAnsweredItems(I.item, ScoringQuestionId),
        totalItems
      }),
      totalItems: totalItems,
      questionnaireItems: QuestionnaireItems,
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    