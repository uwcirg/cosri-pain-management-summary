library PcPtsd5LogicLibrary version '1.0.0'
<<<<<<< HEAD
using FHIR version '4.0.1'
include "FHIRHelpers" version '4.0.1' called FHIRHelpers
=======
using FHIR version '4.0.0'
include "FHIRHelpers" version '4.0.0' called FHIRHelpers
>>>>>>> 83eac68f53639a94e5c72320d14369805ebe59f3
include "Common_LogicLibrary" version '1.0.0' called LogicHelper

parameter dataKey default 'pc-ptsd-5'
parameter id default 'CIRG-PC-PTSD-5'

define QuestionnaireID:
  id
define QuestionnaireShortName: 'pc-ptsd'
define question1LinkId: '/102012-2'
define question2LinkId: '/102013-0'
define question3LinkId: '/102014-8'
define question4LinkId: '/102015-5'
define question5LinkId: '/102016-3'
define ScoringQuestionId: '/102017-1'
define extensionAnswerIndex: 0
define ScoreParams: Tuple {
  minScore: 0,
  maxScore: 5
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
    Question1Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question1LinkId, extensionAnswerIndex)),
    Question2Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question2LinkId, extensionAnswerIndex)),
    Question3Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question3LinkId, extensionAnswerIndex)),
    Question4Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question4LinkId, extensionAnswerIndex)),
    Question5Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question5LinkId, extensionAnswerIndex)),
    scoreQuestionResponse: First(LogicHelper.GetNumericValueByResponseItem(I.item, ScoringQuestionId)),
    itemTotalScore:
          case
            when scoreQuestionResponse is not null then scoreQuestionResponse
            when Question1Score is null then null
            when Question2Score is null then null
            when Question3Score is null then null
            when Question4Score is null then null
            when Question5Score is null then null
            else
              Coalesce(Question1Score, 0) * 1 +
              Coalesce(Question2Score, 0) * 1 +
              Coalesce(Question3Score, 0) * 1 + 
              Coalesce(Question4Score, 0) * 1 +
              Coalesce(Question5Score, 0) * 1
          end,
    
    score: itemTotalScore,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item),
    totalItems: 6
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
