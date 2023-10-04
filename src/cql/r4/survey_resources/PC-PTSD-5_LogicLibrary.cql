library PcPtsd5LogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'


define QuestionnaireName: 'pc-ptsd-5'
define QuestionnaireURL: 'http://www.cdc.gov/ncbddd/fasd/pc-ptsd-5'
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

// -----------------------------------------------------------------------------
// PATIENT INFORMATION
// -----------------------------------------------------------------------------
context Patient


//------------------------------------------------------------------------------
// QUESTIONNAIRE AND QUESTIONNAIRERESPONSE LOGIC
//------------------------------------------------------------------------------

// Load Questionnaire
define PtsdQuestionnaire:
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireName, QuestionnaireURL))

define QuestionnaireItems:
  (PtsdQuestionnaire) Q 
  return Q.item

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], PtsdQuestionnaire, 'PC-PTSD-5')

define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    Question1Score: First(LogicHelper.getScoringByResponseItem(PtsdQuestionnaire, I.item, question1LinkId, extensionAnswerIndex)),
    Question2Score: First(LogicHelper.getScoringByResponseItem(PtsdQuestionnaire, I.item, question2LinkId, extensionAnswerIndex)),
    Question3Score: First(LogicHelper.getScoringByResponseItem(PtsdQuestionnaire, I.item, question3LinkId, extensionAnswerIndex)),
    Question4Score: First(LogicHelper.getScoringByResponseItem(PtsdQuestionnaire, I.item, question4LinkId, extensionAnswerIndex)),
    Question5Score: First(LogicHelper.getScoringByResponseItem(PtsdQuestionnaire, I.item, question5LinkId, extensionAnswerIndex)),
    scoreQuestionResponse: First(LogicHelper.getScoringByResponseItem(PtsdQuestionnaire, I.item, ScoringQuestionId, extensionAnswerIndex)),
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
    // scoreSeverity:
    //     case
    //       when score between 9 and 12 then 'high'
    //       when score between 6 and 8 then 'moderate'
    //       when score between 3 and 5 then 'mild'
    //       else 'low' 
    //     end,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item),
    totalItems: 6
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
      // scoreSeverity: scoreSeverity,
      // scoreMeaning: case
      //   when anxietyScore >= 3 and depressionScore >=3 then 'anxiety and depression'
      //   when anxietyScore >= 3 then 'anxiety'
      //   when depressionScore >= 3 then 'depression'
      //   else '' 
      // end,
      // comparisonToAlert: 'higher',
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
    