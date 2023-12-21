library PromisGlobalLogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'

define QuestionnaireID: 'CIRG-PROMIS-GLOBAL'
define QuestionnaireName: 'promis-global'
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
      qid: QuestionnaireName,
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
    