library GAD7LogicLibrary version '1.0.0'
using FHIR version '4.0.1'
include "FHIRHelpers" version '4.0.1' called FHIRHelpers
include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'

parameter dataKey default 'gad7'
parameter id default 'CIRG-GAD7'

define QuestionnaireID:
  id
define QuestionnaireShortName: 'GAD-7'
define question1LinkId: '/69725-0'
define question2LinkId: '/68509-9'
define question3LinkId: '/69733-4'
define question4LinkId: '/69734-2'
define question5LinkId: '/69735-9'
define question6LinkId: '/69689-8'
define question7LinkId: '/69736-7'
define ScoringQuestionId: '/70274-6'
define QuestionnaireKey:
  dataKey
define answerExtensionIndex: 0
define ScoreParams: Tuple {
  minScore: 0,
  maxScore: 21
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
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireID, QuestionnaireKey))

define QuestionnaireItems:
  (Questionnaire) Q 
  return Q.item

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], Questionnaire)
 
define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    q1Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question1LinkId, answerExtensionIndex)),
    q2Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question2LinkId, answerExtensionIndex)),
    q3Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question3LinkId, answerExtensionIndex)),
    q4Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question4LinkId, answerExtensionIndex)),
    q5Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question5LinkId, answerExtensionIndex)),
    q6Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question6LinkId, answerExtensionIndex)),
    q7Score: First(LogicHelper.GetNumericValueByResponseItemCode(Questionnaire, I.item, question7LinkId, answerExtensionIndex)),
    scoreQuestionResponse: First(LogicHelper.GetNumericValueByResponseItem(I.item, ScoringQuestionId)),
    itemTotalScore: 
      case
        when scoreQuestionResponse is not null then scoreQuestionResponse
        when q1Score is null then null
        when q2Score is null then null
        when q3Score is null then null
        when q4Score is null then null
        when q5Score is null then null
        when q6Score is null then null
        when q7Score is null then null
        else 
          Coalesce(q1Score, 0) * 1 +
          Coalesce(q2Score, 0) * 1 +
          Coalesce(q3Score, 0) * 1 + 
          Coalesce(q4Score, 0) * 1 +
          Coalesce(q5Score, 0) * 1 +
          Coalesce(q6Score, 0) * 1 +
          Coalesce(q7Score, 0) * 1
      end,
    score: itemTotalScore,
    scoreSeverity: case
        when score is null then ''
        when score > 14 then 'high'
        when score between 10 and 14 then 'moderate'
        when score between 5 and 9 then 'mild'
        else 'low'
      end,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item),
    totalItems: 7
    return Tuple {
      id: I.id.value,
      qid: QuestionnaireShortName,
      date: LogicHelper.DateTimeText(I.authored),
      items: I.item,
      responses: responsesOnly,
      scoreQuestionResponse: scoreQuestionResponse,
      score: score,
      minScore: ScoreParams.minScore,
      maxScore: ScoreParams.maxScore,
      scoreSeverity: scoreSeverity,
      scoreMeaning: case
        when scoreSeverity = 'high' then 'severe anxiety'
        when scoreSeverity = 'moderate' then 'moderate anxiety'
        when scoreSeverity = 'mild' then 'mild anxiety'
        else if score > 0 then 'minimal anxiety' else '' 
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
