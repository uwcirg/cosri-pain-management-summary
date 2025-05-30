library Phq4LogicLibrary version '1.0.0'
using FHIR version '4.0.1'
include "FHIRHelpers" version '4.0.1' called FHIRHelpers
include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------
codesystem "LOINC": 'http://loinc.org'

parameter dataKey default 'phq-4'
parameter id default 'CIRG-PHQ-4'

define QuestionnaireID:
  id
define QuestionnaireShortName: 'PHQ-4'
define question1LinkId: '/69725-0'
define question2LinkId: '/68509-9'
define question3LinkId: '/44250-9'
define question4LinkId: '/44255-8'
define ScoringQuestionId: '70272-0'
define extensionAnswerIndex: 0
define ScoreParams: Tuple {
  minScore: 0,
  maxScore: 12
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

define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    Question1Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question1LinkId, extensionAnswerIndex)),
    Question2Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question2LinkId, extensionAnswerIndex)),
    Question3Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question3LinkId, extensionAnswerIndex)),
    Question4Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question4LinkId, extensionAnswerIndex)),
    anxietyScore: 
      case
        when Question1Score is null then null
        when Question2Score is null then null
        else Coalesce(Question1Score, 0) * 1 + Coalesce(Question2Score, 0) * 1
      end,
    depressionScore: 
      case
        when Question3Score is null then null
        when Question4Score is null then null
        else Coalesce(Question3Score, 0) * 1 + Coalesce(Question4Score, 0) * 1
      end,
    scoreQuestionResponse: First(LogicHelper.GetNumericValueByResponseItem(I.item, ScoringQuestionId)),
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
    scoreSeverity:
        case
          when score is null then null
          when score between 9 and 12 then 'high'
          when score between 6 and 8 then 'moderate'
          when score between 3 and 5 then 'mild'
          else 'low' 
        end,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item),
    totalItems: 4
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
      scoreSeverity: scoreSeverity,
      anxietyScore: anxietyScore,
      depressionScore: depressionScore,
      scoreMeaning: case
        when anxietyScore >= 3 and depressionScore >=3 then 'anxiety and depression'
        when anxietyScore >= 3 then 'anxiety'
        when depressionScore >= 3 then 'depression'
        else '' 
      end,
      comparisonToAlert: 'higher',
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
    