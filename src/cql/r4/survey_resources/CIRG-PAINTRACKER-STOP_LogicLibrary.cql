library StopLogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'

define QuestionnaireID: 'CIRG-PainTracker-STOP'
define QuestionnaireName: 'stop'
define question1LinkId: 'STOP-0'
define question2LinkId: 'STOP-1'
define question3LinkId: 'STOP-2'
define question4LinkId: 'STOP-3'
define ScoringQuestionId: 'STOP-score'
define extensionAnswerIndex: 0
define ScoreParams: Tuple {
  minScore: 0,
  maxScore: 4
}

// -----------------------------------------------------------------------------
// PATIENT INFORMATION
// -----------------------------------------------------------------------------
context Patient


//------------------------------------------------------------------------------
// QUESTIONNAIRE AND QUESTIONNAIRERESPONSE LOGIC
//------------------------------------------------------------------------------

// Load Questionnaire
define StopQuestionnaire:
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireID, QuestionnaireName, null))

define Questionnaire:
  StopQuestionnaire

define QuestionnaireItems:
  (StopQuestionnaire) Q 
  return Q.item

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], StopQuestionnaire, QuestionnaireName)

define ReportOnce:
  true

define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    Question1Score: First(LogicHelper.getScoringByResponseItem(StopQuestionnaire, I.item, question1LinkId, extensionAnswerIndex)),
    Question2Score: First(LogicHelper.getScoringByResponseItem(StopQuestionnaire, I.item, question2LinkId, extensionAnswerIndex)),
    Question3Score: First(LogicHelper.getScoringByResponseItem(StopQuestionnaire, I.item, question3LinkId, extensionAnswerIndex)),
    Question4Score: First(LogicHelper.getScoringByResponseItem(StopQuestionnaire, I.item, question4LinkId, extensionAnswerIndex)),
    scoreQuestionResponse: First(LogicHelper.getScoringByResponseItem(StopQuestionnaire, I.item, ScoringQuestionId, extensionAnswerIndex)),
    itemTotalScore:
          case
            when scoreQuestionResponse is not null then scoreQuestionResponse
            when Question1Score is null then null
            when Question2Score is null then null
            when Question3Score is null then null
            when Question4Score is null then null
            else
              Coalesce(Question1Score, 0) * 1 +
              Coalesce(Question2Score, 0) * 1 +
              Coalesce(Question3Score, 0) * 1 + 
              Coalesce(Question4Score, 0) * 1
          end,
    
    score: itemTotalScore,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item),
    totalItems: 4
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
      comparisonToAlert: 'higher',
      totalAnsweredItems: Min({Length(
        (responsesOnly) O where 
          (PositionOf(O.linkId, ScoringQuestionId) = -1 or PositionOf(ScoringQuestionId, O.linkId) = -1)
          and O.answer is not null
        ), totalItems}),
      totalItems: totalItems,
      questionnaireItems: QuestionnaireItems,
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    