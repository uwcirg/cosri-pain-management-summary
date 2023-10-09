library PromisGlobalLogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'


define QuestionnaireName: 'promis-global'
define QuestionnaireURL: 'http://www.cdc.gov/ncbddd/fasd/promis-global'
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
  minScore: 20,
  maxScore: 80
}

// -----------------------------------------------------------------------------
// PATIENT INFORMATION
// -----------------------------------------------------------------------------
context Patient


//------------------------------------------------------------------------------
// QUESTIONNAIRE AND QUESTIONNAIRERESPONSE LOGIC
//------------------------------------------------------------------------------

// Load Questionnaire
define PromisQuestionnaire:
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireName, QuestionnaireURL))

define QuestionnaireItems:
  (PromisQuestionnaire) Q 
  return Q.item

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], PromisQuestionnaire, 'PROMIS-GLOBAL')

define ReportOnce:
  true
  
define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    Question1Score: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, question1LinkId, extensionAnswerIndex)),
    Question2Score: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, question2LinkId, extensionAnswerIndex)),
    Question3Score: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, question3LinkId, extensionAnswerIndex)),
    Question4Score: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, question4LinkId, extensionAnswerIndex)),
    Question5Score: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, question5LinkId, extensionAnswerIndex)),
    Question6Score: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, question6LinkId, extensionAnswerIndex)),
    Question7Score: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, question7LinkId, extensionAnswerIndex)),
    Question8Score: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, question8LinkId, extensionAnswerIndex)),
    Question9Score: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, question9LinkId, extensionAnswerIndex)),
    Question10Score: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, question10LinkId, extensionAnswerIndex)),
    scoreQuestionResponse: First(LogicHelper.getScoringByResponseItem(PromisQuestionnaire, I.item, ScoringQuestionId, extensionAnswerIndex)),
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
            when Question10Score is null then null
            else
              Coalesce(Question1Score, 0) * 1 +
              Coalesce(Question2Score, 0) * 1 +
              Coalesce(Question3Score, 0) * 1 + 
              Coalesce(Question4Score, 0) * 1 +
              Coalesce(Question5Score, 0) * 1 +
              Coalesce(Question6Score, 0) * 1 +
              Coalesce(Question7Score, 0) * 1 +
              Coalesce(Question8Score, 0) * 1 +
              Coalesce(Question9Score, 0) * 1 +
              Coalesce(Question10Score, 0) * 1
          end,
    
    score: itemTotalScore,
    // scoreSeverity:
    //     case
    //       when score >= 20 then 'high'
    //       when score between 15 and 19 then 'moderately high'
    //       when score between 10 and 14 then 'moderate'
    //       when score between 5 and 9 then 'mild'
    //       else 'low' 
    //     end,
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
      //scoreSeverity: scoreSeverity,
      // scoreMeaning: case
      //   when scoreSeverity = 'high' then 'severe depression'
      //   when scoreSeverity = 'moderately high' then 'moderately severe depression'
      //   when scoreSeverity = 'moderate' then 'moderate depression'
      //   when scoreSeverity = 'mild' then 'mild depression'
      //   else if score > 0 then 'minimal depression' else '' 
      // end,
      // comparisonToAlert: 'lower',
      totalAnsweredItems: Min({Length(
        (responsesOnly) O where 
          (PositionOf(O.linkId, ScoringQuestionId) = -1 or PositionOf(ScoringQuestionId, O.linkId) = -1)
          and O.answer is not null
        ), totalItems}),
      totalItems: totalItems,
      reportOnce: true,
      questionnaireItems: QuestionnaireItems,
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    