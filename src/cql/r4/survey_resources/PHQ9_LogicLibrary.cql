library Phq9LogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'


define QuestionnaireName: 'phq9'
define QuestionnaireURL: 'http://www.cdc.gov/ncbddd/fasd/phq9'
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
define Phq9Questionnaire:
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireName, QuestionnaireURL))

// Determine the index of each question based upon the extracted link ID
define IndexOfQuestion:
  (Phq9Questionnaire) Q
  let
    ItemLinkIds: LogicHelper.GetItemLinkIds(Q)
    return {
      one: IndexOf(ItemLinkIds, question1LinkId),
      two: IndexOf(ItemLinkIds, question2LinkId),
      three: IndexOf(ItemLinkIds, question3LinkId),
      four: IndexOf(ItemLinkIds, question4LinkId),
      five: IndexOf(ItemLinkIds, question5LinkId),
      six: IndexOf(ItemLinkIds, question6LinkId),
      seven: IndexOf(ItemLinkIds, question7LinkId),
      eight: IndexOf(ItemLinkIds, question8LinkId),
      nine: IndexOf(ItemLinkIds, question9LinkId)
    }

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], Phq9Questionnaire, 'PHQ9')

define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    score: 
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question1LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question2LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question3LinkId, extensionAnswerIndex)), 0) + 
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question4LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question5LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question6LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question7LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question8LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question9LinkId, extensionAnswerIndex)), 0),
    scoreSeverity:
        case
          when score >= 20 then 'high'
          when score between 15 and 19 then 'moderately high'
          when score between 10 and 14 then 'moderate'
          when score between 5 and 9 then 'mild'
          else 'low' 
        end,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item, ScoringQuestionId),
    responses: if Phq9Questionnaire is not null then 
        LogicHelper.getResponsesByQuestionnaire(Phq9Questionnaire, I.item, ScoringQuestionId) else 
        responsesOnly,
    totalItems: Length(LogicHelper.GetAnswerLinkIdsByQuestionnaire(Phq9Questionnaire, ScoringQuestionId))
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
        when scoreSeverity = 'high' then 'severe depression'
        when scoreSeverity = 'moderately high' then 'moderately severe depression'
        when scoreSeverity = 'moderate' then 'moderate depression'
        when scoreSeverity = 'mild' then 'mild depression'
        else if score > 0 then 'minimal depression' else '' 
      end,
      comparisonToAlert: 'higher',
      totalAnsweredItems: Min({Length((I.item) O where O.linkId.value != ScoringQuestionId), totalItems}),
      totalItems: totalItems,
      authoredDate: I.authored,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc