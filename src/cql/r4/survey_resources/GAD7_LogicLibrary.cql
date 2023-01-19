library GAD7LogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'


// Local (non-standard) codes
// Not sure if this qualifies as LOCAL...
// code "GAD7 Total Score code": '70274-6' from "LOCAL" display 'GAD7 Total Score'

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

define answerExtensionIndex: 1
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

// Load the most recent completed questionnaireResponse
define CurrentQuestionnaireResponse:
  First(QuestionnaireResponses QR
    where QR.status.value = 'completed'
    sort by authored desc
  )

// Extract the items from the QuestionnaireResponse
define CurrentResponseItems:
  CurrentQuestionnaireResponse QR
  return QR.item
      
// Question 1
define Gad7ScoreQuestion1:
  LogicHelper.getQuestionScore(Gad7Questionnaire, CurrentResponseItems, IndexOfQuestion.one, question1LinkId, answerExtensionIndex)

// Question 2
define Gad7ScoreQuestion2:
  LogicHelper.getQuestionScore(Gad7Questionnaire, CurrentResponseItems, IndexOfQuestion.two, question2LinkId, answerExtensionIndex)

// Question 3
define Gad7ScoreQuestion3:
  LogicHelper.getQuestionScore(Gad7Questionnaire, CurrentResponseItems, IndexOfQuestion.three, question3LinkId, answerExtensionIndex)

// Question 4
define Gad7ScoreQuestion4:
  LogicHelper.getQuestionScore(Gad7Questionnaire, CurrentResponseItems, IndexOfQuestion.four, question4LinkId, answerExtensionIndex)

// Question 5
define Gad7ScoreQuestion5:
  LogicHelper.getQuestionScore(Gad7Questionnaire, CurrentResponseItems, IndexOfQuestion.five, question5LinkId, answerExtensionIndex)

// Question 6
define Gad7ScoreQuestion6:
  LogicHelper.getQuestionScore(Gad7Questionnaire, CurrentResponseItems, IndexOfQuestion.six, question6LinkId, answerExtensionIndex)

// Question 7
define Gad7ScoreQuestion7:
  LogicHelper.getQuestionScore(Gad7Questionnaire, CurrentResponseItems, IndexOfQuestion.seven, question7LinkId, answerExtensionIndex)

// Calculate the score for the Full GAD7
// sum up all numeric values for all the answers
define FullScore:
  Gad7ScoreQuestion1
  + Gad7ScoreQuestion2
  + Gad7ScoreQuestion3
  + Gad7ScoreQuestion4
  + Gad7ScoreQuestion5
  + Gad7ScoreQuestion6
  + Gad7ScoreQuestion7
 
define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    score: 
          Coalesce(First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question1LinkId, answerExtensionIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question2LinkId, answerExtensionIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question3LinkId, answerExtensionIndex)), 0) + 
          Coalesce(First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question4LinkId, answerExtensionIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question5LinkId, answerExtensionIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question6LinkId, answerExtensionIndex)), 0) +
          Coalesce(First(LogicHelper.getScoringByResponseItem(Gad7Questionnaire, I.item, question7LinkId, answerExtensionIndex)), 0),
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item, ScoringQuestionId),
    responses: if Gad7Questionnaire is not null then 
        LogicHelper.getResponsesByQuestionnaire(Gad7Questionnaire, I.item, ScoringQuestionId) else 
        responsesOnly
    return Tuple {
      id: I.id.value,
      date: LogicHelper.DateTimeText(I.authored),
      items: I.item,
      responses: responses,
      score: score,
      scoreSeverity: case
        when score > 15 then 'high'
        when score between 10 and 14 then 'moderate'
        when score between 5 and 9 then 'mild'
        else 'low'
      end, 
      authoredDate: I.authored,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by date desc, lastUpdated desc
