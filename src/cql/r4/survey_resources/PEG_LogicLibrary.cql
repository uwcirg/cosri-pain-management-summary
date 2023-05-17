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
define Question1LinkId: '108518'
define Question2LinkId: '91145-3'
define Question3LinkId: '91146-1'
define ScoringQuestionId: '91147-9' // Mean score
define SumScoreQuestionId: 'CIRG-PEG-SUM'
define extensionAnswerIndex: 0
define ScoreParams: Tuple {
  minScore: 0,
  maxScore: 10
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

define QuestionnaireResponses:
  LogicHelper.MatchedReponsesByQuestionnaire([QuestionnaireResponse], PegQuestionnaire, 'PEG')

define ResponsesCompleted:
    Length(QuestionnaireResponses)

define ResponsesSummary:
  (QuestionnaireResponses) I
  let
    score: ToInteger(First(LogicHelper.GetResponseAnswerByLinkId(ScoringQuestionId, I.item))), // mean score
    sumScore: ToInteger(First(LogicHelper.GetResponseAnswerByLinkId(SumScoreQuestionId, I.item))), // mean score
    scoreSeverity:
        case
          when score > 6 then 'high'
          when score between 4 and 6 then 'moderate'
          when score between 1 and 3 then 'mild'
          else 'low' 
        end,
    responsesOnly: LogicHelper.FormattedQuestionnaireResponses(I.item, ''),
    responses: if PegQuestionnaire is not null then 
        LogicHelper.getResponsesByQuestionnaire(PegQuestionnaire, I.item, '') else 
        responsesOnly,
    Question1Score: First(LogicHelper.GetResponseAnswerByLinkId(Question1LinkId, I.item)),
    Question2Score: First(LogicHelper.GetResponseAnswerByLinkId(Question2LinkId, I.item)),
    Question3Score: First(LogicHelper.GetResponseAnswerByLinkId(Question3LinkId, I.item)),
    totalItems: 3
    return Tuple {
      id: I.id.value,
      qid: QuestionnaireName,
      date: LogicHelper.DateTimeText(I.authored),
      items: I.item,
      responses: responses,
      Question1Score: ToInteger(Question1Score),
      Question2Score: ToInteger(Question2Score),
      Question3Score: ToInteger(Question3Score),
      responses_completed: ResponsesCompleted,
      sum_score: sumScore,
      mean_score: score,
      score: score,
      minScore: ScoreParams.minScore,
      maxScore: ScoreParams.maxScore,
      scoreSeverity: scoreSeverity,
      scoreMeaning: case
        when scoreSeverity = 'high' then 'severe pain'
        when scoreSeverity = 'moderate' then 'moderate pain'
        when scoreSeverity = 'mild' then 'mild pain'
        else '' 
      end,
      comparisonToAlert: 'higher',
      totalAnsweredItems: Min({Length((I.item) O where O.linkId.value != ScoringQuestionId), totalItems}),
      totalItems: totalItems,
      authoredDate: I.authored.value,
      lastUpdated: I.meta.lastUpdated.value
    }
    sort by authoredDate desc, lastUpdated desc
    