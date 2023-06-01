library PegLogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'


define QuestionnaireName: 'peg'
define QuestionnaireURL: 'http://www.cdc.gov/ncbddd/fasd/peg'
define Question1LinkId: '75893-8'
define Question2LinkId: '91145-3'
define Question3LinkId: '91146-1'
define ScoringQuestionId: '91147-9' // Mean score
define MeanScoreQuestionId: '91147-9' // Mean score
define extensionAnswerIndex: 0
define ScoreParams: Tuple {
  minScore: 0,
  maxScore: 30
}

// -----------------------------------------------------------------------------
// PATIENT INFORMATION
// -----------------------------------------------------------------------------
context Patient


//------------------------------------------------------------------------------
// QUESTIONNAIRE AND QUESTIONNAIRERESPONSE LOGIC
//------------------------------------------------------------------------------

// Load Questionnaire
define PegQuestionnaire:
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireName, QuestionnaireURL))

define QuestionnaireItems:
  (PegQuestionnaire) Q 
  return Q.item

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], PegQuestionnaire, 'PEG')

define ResponsesCompleted:
    Length(QuestionnaireResponses)

define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    meanScoreFromQuestionnaire: ToInteger(First(LogicHelper.GetResponseAnswerByLinkId(MeanScoreQuestionId, I.item))), // mean score
    //scoreSeverity:
        // case
        //   when score > 15 then 'high'
        //   when score between 1 and 14 then 'mild'
        //   else 'low' 
        // end,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item),
    // responses: if PegQuestionnaire is not null then 
    //     LogicHelper.getResponsesByQuestionnaire(PegQuestionnaire, I.item, '') else 
    //     responsesOnly,
    Question1Score: Coalesce(ToInteger(First(LogicHelper.GetResponseAnswerByLinkId(Question1LinkId, I.item))), 0),
    Question2Score: Coalesce(ToInteger(First(LogicHelper.GetResponseAnswerByLinkId(Question2LinkId, I.item))), 0),
    Question3Score: Coalesce(ToInteger(First(LogicHelper.GetResponseAnswerByLinkId(Question3LinkId, I.item))), 0),
    sumScore: Question1Score + Question2Score + Question3Score,
    scoredItems: responsesOnly R where R.linkId != MeanScoreQuestionId return R.answer,
    meanScore: if meanScoreFromQuestionnaire > 0 then meanScoreFromQuestionnaire else Round(sumScore / 3),
    totalItems: 3
    return Tuple {
      id: I.id.value,
      qid: QuestionnaireName,
      date: LogicHelper.DateTimeText(I.authored),
      items: I.item,
      responses: responsesOnly,
      Question1Score: Question1Score,
      Question2Score: Question2Score,
      Question3Score: Question3Score,
      meanScoreFromQuestionnaire: meanScoreFromQuestionnaire,
      responses_completed: ResponsesCompleted,
      sum_score: sumScore,
      mean_score: meanScoreFromQuestionnaire,
      scoredItems: scoredItems,
      score: sumScore,
      minScore: ScoreParams.minScore,
      maxScore: ScoreParams.maxScore,
      //scoreSeverity: scoreSeverity,
      // scoreMeaning: case
      //   when scoreSeverity = 'high' then 'high pain'
      //   else '' 
      // end,
      comparisonToAlert: 'higher',
      totalAnsweredItems: Min({Length((I.item) O where O.answer is not null and (O.linkId.value is null or (O.linkId.value is not null and O.linkId.value != ScoringQuestionId and O.linkId != MeanScoreQuestionId))), totalItems}),
      totalItems: totalItems,
      questionnaireItems: QuestionnaireItems,
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    