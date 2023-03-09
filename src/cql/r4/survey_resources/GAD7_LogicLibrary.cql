library GAD7LogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'


define QuestionnaireName: 'gad7'
define QuestionnaireURL: 'http://www.cdc.gov/ncbddd/fasd/gad7'
define question1LinkId: '/69725-0'
define question2LinkId: '/68509-9'
define question3LinkId: '/69733-4'
define question4LinkId: '/69734-2'
define question5LinkId: '/69735-9'
define question6LinkId: '/69689-8'
define question7LinkId: '/69736-7'
define ScoringQuestionId: '/70274-6'

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

// We need to set the QuestionnaireURL parameter to an expression before we can use it
define CurrentQuestionnaireURL:
  QuestionnaireURL

// Load Questionnaire
define Gad7Questionnaire:
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireName, QuestionnaireURL))

// Determine the index of each question based upon the extracted link ID
define IndexOfQuestion:
  (Gad7Questionnaire) Q
  let
    ItemLinkIds: LogicHelper.GetItemLinkIds(Q)
    return {
      one: IndexOf(ItemLinkIds, question1LinkId),
      two: IndexOf(ItemLinkIds, question2LinkId),
      three: IndexOf(ItemLinkIds, question3LinkId),
      four: IndexOf(ItemLinkIds, question4LinkId),
      five: IndexOf(ItemLinkIds, question5LinkId),
      six: IndexOf(ItemLinkIds, question6LinkId),
      seven: IndexOf(ItemLinkIds, question7LinkId)
    }

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], Gad7Questionnaire, 'GAD7')
 
define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    q1Score: First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question1LinkId, answerExtensionIndex)),
    q2Score: First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question2LinkId, answerExtensionIndex)),
    q3Score: First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question3LinkId, answerExtensionIndex)),
    q4Score: First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question4LinkId, answerExtensionIndex)),
    q5Score: First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question5LinkId, answerExtensionIndex)),
    q6Score: First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question6LinkId, answerExtensionIndex)),
    q7Score: First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question7LinkId, answerExtensionIndex)),
    score: 
          Coalesce(q1Score, 0) * 1 +
          Coalesce(q2Score, 0) * 1 +
          Coalesce(q3Score, 0) * 1 + 
          Coalesce(q4Score, 0) * 1 +
          Coalesce(q5Score, 0) * 1 +
          Coalesce(q6Score, 0) * 1 +
          Coalesce(q7Score, 0) * 1,
    scoreSeverity: case
        when score > 14 then 'high'
        when score between 10 and 14 then 'moderate'
        when score between 5 and 9 then 'mild'
        else 'low'
      end,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item, ScoringQuestionId),
    responses: if Gad7Questionnaire is not null then 
        LogicHelper.getResponsesByQuestionnaire(Gad7Questionnaire, I.item, ScoringQuestionId) else 
        responsesOnly
    return Tuple {
      id: I.id.value,
      qid: QuestionnaireName,
      date: LogicHelper.DateTimeText(I.authored),
      items: I.item,
      responses: responses,
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
      totalAnsweredItems: Length((I.item) O where O.linkId.value != ScoringQuestionId),
      totalItems: Length(LogicHelper.GetAnswerLinkIdsByQuestionnaire(Gad7Questionnaire, ScoringQuestionId)),
      authoredDate: I.authored,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by date desc, lastUpdated desc
