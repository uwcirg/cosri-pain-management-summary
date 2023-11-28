library Phq9LogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'

define QuestionnaireID: 'CIRG-PHQ9'
define QuestionnaireName: 'phq9'
define question1LinkId: '/44250-9'
define question2LinkId: '/44255-8'
define question3LinkId: '/44259-0'
define question4LinkId: '/44254-1'
define question5LinkId: '/44251-7'
define question6LinkId: '/44258-2'
define question7LinkId: '/44252-5'
define question8LinkId: '/44253-3'
define question9LinkId: '/44260-8'
define ScoringQuestionId: '/44261-6'
define extensionAnswerIndex: 0
define ScoreParams: Tuple {
  minScore: 0,
  maxScore: 27
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

define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    Question1Score: First(LogicHelper.getScoringByResponseItem(Questionnaire, I.item, question1LinkId, extensionAnswerIndex)),
    Question2Score: First(LogicHelper.getScoringByResponseItem(Questionnaire, I.item, question2LinkId, extensionAnswerIndex)),
    Question3Score: First(LogicHelper.getScoringByResponseItem(Questionnaire, I.item, question3LinkId, extensionAnswerIndex)),
    Question4Score: First(LogicHelper.getScoringByResponseItem(Questionnaire, I.item, question4LinkId, extensionAnswerIndex)),
    Question5Score: First(LogicHelper.getScoringByResponseItem(Questionnaire, I.item, question5LinkId, extensionAnswerIndex)),
    Question6Score: First(LogicHelper.getScoringByResponseItem(Questionnaire, I.item, question6LinkId, extensionAnswerIndex)),
    Question7Score: First(LogicHelper.getScoringByResponseItem(Questionnaire, I.item, question7LinkId, extensionAnswerIndex)),
    Question8Score: First(LogicHelper.getScoringByResponseItem(Questionnaire, I.item, question8LinkId, extensionAnswerIndex)),
    Question9Score: First(LogicHelper.getScoringByResponseItem(Questionnaire, I.item, question9LinkId, extensionAnswerIndex)),
    scoreQuestionResponse: First(LogicHelper.getScoringByResponseItem(Questionnaire, I.item, ScoringQuestionId, extensionAnswerIndex)),
    itemTotalScore:
          case
            when scoreQuestionResponse is not null then scoreQuestionResponse
            when Question1Score is null then null
            when Question2Score is null then null
            when Question3Score is null then null
            when Question4Score is null then null
            when Question5Score is null then null
            when Question6Score is null then null
            when Question7Score is null then null
            when Question8Score is null then null
            when Question9Score is null then null
            else
              Coalesce(Question1Score, 0) * 1 +
              Coalesce(Question2Score, 0) * 1 +
              Coalesce(Question3Score, 0) * 1 + 
              Coalesce(Question4Score, 0) * 1 +
              Coalesce(Question5Score, 0) * 1 +
              Coalesce(Question6Score, 0) * 1 +
              Coalesce(Question7Score, 0) * 1 +
              Coalesce(Question8Score, 0) * 1 +
              Coalesce(Question9Score, 0) * 1 
          end,
    
    score: itemTotalScore,
    scoreSeverity:
        case
          when score >= 20 then 'high'
          when score between 15 and 19 then 'moderately high'
          when score between 10 and 14 then 'moderate'
          when score between 5 and 9 then 'mild'
          else 'low' 
        end,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item),
    totalItems: 9
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
      scoreSeverity: scoreSeverity,
      scoreMeaning: case
        when scoreSeverity = 'high' then 'severe depression'
        when scoreSeverity = 'moderately high' then 'moderately severe depression'
        when scoreSeverity = 'moderate' then 'moderate depression'
        when scoreSeverity = 'mild' then 'mild depression'
        else if score > 0 then 'minimal depression' else '' 
      end,
      comparisonToAlert: 'higher',
      totalAnsweredItems: Min({
        LogicHelper.getTotalAnsweredItems(I.item, ScoringQuestionId),
        totalItems
      }),
      totalItems: totalItems,
      questionnaireItems: QuestionnaireItems,
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    