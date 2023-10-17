library PegLogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

include "Common_LogicLibrary" version '1.0.0' called LogicHelper

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'

define QuestionnaireID: 'CIRG-PEG'
define QuestionnaireName: 'peg'
define Question1LinkId: '75893-8'
define Question2LinkId: '91145-3'
define Question3LinkId: '91146-1'
define ScoringQuestionId: 'CIRG-PEG-SUM' // sum score
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
  First(LogicHelper.GetMatchQuestionnaire(QuestionnaireID, QuestionnaireName, null))

define Questionnaire:
  PegQuestionnaire

define QuestionnaireItems:
  (PegQuestionnaire) Q 
  return Q.item

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], PegQuestionnaire, QuestionnaireName)

define ResponsesCompleted:
    Length(QuestionnaireResponses)

define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    meanScoreResponse: First(LogicHelper.GetResponseAnswerByLinkId(MeanScoreQuestionId, I.item)),
    reportedMeanScore: 
      if meanScoreResponse is null then null
      else ToInteger(meanScoreResponse), // mean score
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item),
    scoreQuestionResponse: First(LogicHelper.getScoringByResponseItem(PegQuestionnaire, I.item, ScoringQuestionId, extensionAnswerIndex)),
    Question1Answer: First(LogicHelper.GetResponseAnswerByLinkId(Question1LinkId, I.item)),
    Question2Answer: First(LogicHelper.GetResponseAnswerByLinkId(Question2LinkId, I.item)),
    Question3Answer: First(LogicHelper.GetResponseAnswerByLinkId(Question3LinkId, I.item)),
    Question1Score: Coalesce(ToInteger(Question1Answer), 0),
    Question2Score: Coalesce(ToInteger(Question2Answer), 0),
    Question3Score: Coalesce(ToInteger(Question3Answer), 0),
    sumScore: 
      case
        when scoreQuestionResponse is not null then scoreQuestionResponse
        when Question1Answer is null then null
        when Question2Answer is null then null
        when Question3Answer is null then null
        else
          // only get sum score of score from each question is available
          Question1Score + Question2Score + Question3Score
      end,
    meanScore: 
      if reportedMeanScore is not null and reportedMeanScore > 0 
      then reportedMeanScore
      else 
        if sumScore is not null then Round(sumScore / 3) else null,
    totalItems: 3
    return Tuple {
      id: I.id.value,
      qid: QuestionnaireName,
      date: LogicHelper.DateTimeText(I.authored),
      items: I.item,
      responses: responsesOnly union {
        linkId: 'PEG_total_score',
        question: 'PEG score',
        answer: ToString(sumScore)
      },
      Question1Answer: Question1Answer,
      Question2Answer: Question2Answer,
      Question3Answer: Question3Answer,
      Question1Score: Question1Score,
      Question2Score: Question2Score,
      Question3Score: Question3Score,
      responses_completed: ResponsesCompleted,
      sum_score: sumScore,
      mean_score: meanScore,
      score: sumScore,
      minScore: ScoreParams.minScore,
      maxScore: ScoreParams.maxScore,
      comparisonToAlert: 'higher',
      totalAnsweredItems: Min({Length(
        (responsesOnly) O where 
          (
            PositionOf(O.linkId, ScoringQuestionId) = -1 or PositionOf(ScoringQuestionId, O.linkId) = -1)
            and O.linkId != 'PEG score'
            and O.answer is not null
        ), totalItems}),
      totalItems: totalItems,
      questionnaireItems: QuestionnaireItems,
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    