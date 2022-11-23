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
define question10LinkId: '/69722-7'
define extensionAnswerIndex: 0

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
      nine: IndexOf(ItemLinkIds, question9LinkId),
      ten: IndexOf(ItemLinkIds, question10LinkId)
    }

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], Phq9Questionnaire)

// Load the most recent completed QuestionnaireResponse
define CurrentQuestionnaireResponse:
  First(QuestionnaireResponses QR
    where QR.status.value = 'completed'
  )

// Extract the items from the QuestionnaireResponse
define CurrentResponseItems:
  CurrentQuestionnaireResponse QR
  return QR.item


// Question 1
define Phq9ScoreQuestion1:
  LogicHelper.getQuestionScore(Phq9Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question1LinkId, extensionAnswerIndex)

// Question 2
define Phq9ScoreQuestion2:
  LogicHelper.getQuestionScore(Phq9Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question2LinkId, extensionAnswerIndex)

// Question 3
define Phq9ScoreQuestion3:
  LogicHelper.getQuestionScore(Phq9Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question3LinkId, extensionAnswerIndex)

// Question 4
define Phq9ScoreQuestion4:
  LogicHelper.getQuestionScore(Phq9Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question4LinkId, extensionAnswerIndex)

// Question 5
define Phq9ScoreQuestion5:
  LogicHelper.getQuestionScore(Phq9Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question5LinkId, extensionAnswerIndex)

// Question 6
define Phq9ScoreQuestion6:
  LogicHelper.getQuestionScore(Phq9Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question6LinkId, extensionAnswerIndex)

// Question 7
define Phq9ScoreQuestion7:
  LogicHelper.getQuestionScore(Phq9Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question7LinkId, extensionAnswerIndex)
// Question 8
define Phq9ScoreQuestion8:
  LogicHelper.getQuestionScore(Phq9Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question8LinkId, extensionAnswerIndex)

// Question 9
define Phq9ScoreQuestion9:
  LogicHelper.getQuestionScore(Phq9Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question9LinkId, extensionAnswerIndex)

// Question 10
define Phq9ScoreQuestion10:
  LogicHelper.getQuestionScore(Phq9Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question10LinkId, extensionAnswerIndex)

// Calculate the score for the Full PHQ9
// sum up all numeric values for all the answers
define FullScore:
  Phq9ScoreQuestion1
  + Phq9ScoreQuestion2
  + Phq9ScoreQuestion3
  + Phq9ScoreQuestion4
  + Phq9ScoreQuestion5
  + Phq9ScoreQuestion6
  + Phq9ScoreQuestion7
  + Phq9ScoreQuestion8
  + Phq9ScoreQuestion9
  + Phq9ScoreQuestion10

define ResponsesSummary:
  (QuestionnaireResponses) I
  return Tuple {
    date: LogicHelper.DateTimeText(I.authored),
    items: I.item,
    responses: LogicHelper.getResponsesByQuestionnaire(Phq9Questionnaire, I.item),
    score: 
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question1LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question2LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question3LinkId, extensionAnswerIndex)), 0) + 
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question4LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question5LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question6LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question7LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question8LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question9LinkId, extensionAnswerIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Phq9Questionnaire, I.item, question10LinkId, extensionAnswerIndex)), 0),
    authoredDate: I.authored,
    lastUpdated: I.meta.lastUpdated.value
  }
  sort by date desc, lastUpdated desc