library Phq9LogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'
// codesystem "LOCAL": 'http://www.cdc.gov/ncbddd/fasd'


// Local (non-standard) codes
// 44261-6 does link to PHQ9 score in Questionnaire-PHQ9.json
// Not sure if this qualifies as LOCAL...
// code "PHQ9 Total Score code": '44261-6' from "LOCAL" display 'PHQ9 Total Score'


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

// -----------------------------------------------------------------------------
// PATIENT INFORMATION
// -----------------------------------------------------------------------------
context Patient

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------
// Returns a text representation of a dateTime using the CQL `ToString` function.
// @param d - a FHIR dateTime to get text for
// @returns {System.String} the text representation of the dateTime
define function DateTimeText(d FHIR.dateTime):
  ToString(d.value)

// -----------------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------------

define function ToCode(coding FHIR.Coding):
  FHIRHelpers.ToCode(coding)

define function ToConcept(concept FHIR.CodeableConcept):
  FHIRHelpers.ToConcept(concept)


//------------------------------------------------------------------------------
// QUESTIONNAIRE AND QUESTIONNAIRERESPONSE LOGIC
//------------------------------------------------------------------------------

// Load Questionnaire
define Phq9Questionnaire:
  singleton from ([Questionnaire] Q
    where (
      Q.url.value = QuestionnaireURL or
      PositionOf(Lower(QuestionnaireName), Lower(Q.id)) != -1 or
      PositionOf(Lower(QuestionnaireName), Lower(Q.name)) != -1 or
      Lower(Q.name) = Lower(QuestionnaireName)
    ))

// Extract of the link IDs of each item in the Questionnaire
define ItemLinkIds:
  Phq9Questionnaire Q
  let item: Q.item
  return item.linkId.value

// Determine the index of each question based upon the extracted link ID
define IndexOfQuestion:
  {
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
  ([QuestionnaireResponse] QR
    where (
      QR.questionnaire.value = QuestionnaireURL or
      PositionOf(Phq9Questionnaire.id, QR.questionnaire.value)  != -1)
    sort by authored desc
  )

// Load the most recent completed QuestionnaireResponse
define CurrentQuestionnaireResponse:
  First(QuestionnaireResponses QR
    where QR.status.value = 'completed'
  )

// Extract the items from the QuestionnaireResponse
define CurrentResponseItems:
  CurrentQuestionnaireResponse QR
  return QR.item

// Extract the answers from each item in the QuestionnaireResponse
define CurrentResponses:
  (CurrentResponseItems) I
  return Tuple {
    id: I.linkId.value,
    answer: I.answer.value[0] // Assuming only one answer per question
  }

/*
 @param question linkId of type FHIR.String
 @return answer element with that linkId
 */
define function getCurrentResponseByQuestionId(qid String):
  (
    CurrentResponses R
    where R.id = qid
  ) CR 
  return if CR is not null then CR.answer else null

/*
 retrieve concept code of the selected answer option
 @param question index of type FHIR.Integer
 @return code value for the answer
 */
define function getAnswerOptionCodeValue(qIndex Integer):
  if Phq9Questionnaire.item[qIndex] is not null then
    Phq9Questionnaire.item[qIndex].answerOption.value.code.value
  else
    null

/*
 * retrieve the numeric value for the answer from extension
 * @param a list of elements of type FHIR.Extension
 * @return the value as Integer
 */
define function getAnswerOptionExtensionValue(extList List<FHIR.Extension>):
  (extList e where e.url ~ 'http://hl7.org/fhir/StructureDefinition/ordinalValue')[0].value.value as Integer

/* @param qIndex, question index,
 * @param qId, question id, e.g. linkId
 * @return score for the question
 */
define function getQuestionScore(qIndex Integer, qId String):
    (getCurrentResponseByQuestionId(qId)[0]) qResponse
    let
      qAnswerOptionCode: getAnswerOptionCodeValue(qIndex),
      qResponseIndex: if qResponse is not null then IndexOf(qAnswerOptionCode, qResponse.code.value as String) else -1,
      extensionItem: Phq9Questionnaire.item[qIndex].answerOption[qResponseIndex].extension
    return
      if qResponseIndex != -1 then
        if extensionItem is not null then
          extensionItem[0].value.value as Integer
        else 0
      else
        0
      
// Question 1
define Phq9ScoreQuestion1:
  getQuestionScore(IndexOfQuestion.one, question1LinkId)

// Question 2
define Phq9ScoreQuestion2:
  getQuestionScore(IndexOfQuestion.two, question2LinkId)

// Question 3
define Phq9ScoreQuestion3:
  getQuestionScore(IndexOfQuestion.three, question3LinkId)

// Question 4
define Phq9ScoreQuestion4:
  getQuestionScore(IndexOfQuestion.four, question4LinkId)

// Question 5
define Phq9ScoreQuestion5:
  getQuestionScore(IndexOfQuestion.five, question5LinkId)

// Question 6
define Phq9ScoreQuestion6:
  getQuestionScore(IndexOfQuestion.six, question6LinkId)

// Question 7
define Phq9ScoreQuestion7:
  getQuestionScore(IndexOfQuestion.seven, question7LinkId)

// Question 8
define Phq9ScoreQuestion8:
  getQuestionScore(IndexOfQuestion.eight, question8LinkId)

// Question 9
define Phq9ScoreQuestion9:
  getQuestionScore(IndexOfQuestion.nine, question9LinkId)

// Question 10
define Phq9ScoreQuestion10:
  getQuestionScore(IndexOfQuestion.ten, question10LinkId)

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

/*
 * retrieve the numeric value for the answer based on value code
 * @param code as String
 * @return the value as Integer
 */
define function getAnswerValueByCode(code String):
  ((Phq9Questionnaire.item.answerOption) Q where Q.value.code = code) a
  return a.extension[0].value.value as Integer

define function GetResponseAnswerByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where r.linkId.value = linkId) I
  return case
      //answer in FHIR coding format 
      when I.answer[0].value.display is not null then I.answer[0].value.display.value
      else I.answer[0].value.value
    end

define function getScoringByResponseItem(responses List<FHIR.QuestionnaireResponse.Item>, linkId String):
  singleton from (((responses) o where o.linkId.value = linkId) I
  return 
    if I.answer[0].value.code is not null then getAnswerValueByCode(I.answer[0].value.code.value) else 0)

define function getResponsesByQuestionnaire(responses List<FHIR.QuestionnaireResponse.Item>):
  (Phq9Questionnaire.item o where o.linkId.value != 'introduction') I 
  return {
      question: I.text.value,
      answer: First(GetResponseAnswerByLinkId(I.linkId.value, responses))
    }
 
define ResponsesSummary:
  (QuestionnaireResponses) I
  return Tuple {
    date: DateTimeText(I.authored),
    items: I.item,
    responses: getResponsesByQuestionnaire(I.item),
    score: First(getScoringByResponseItem(I.item, question1LinkId)) +
          First(getScoringByResponseItem(I.item, question2LinkId)) +
          First(getScoringByResponseItem(I.item, question3LinkId)) + 
          First(getScoringByResponseItem(I.item, question4LinkId)) +
          First(getScoringByResponseItem(I.item, question5LinkId)) +
          First(getScoringByResponseItem(I.item, question6LinkId)) +
          First(getScoringByResponseItem(I.item, question7LinkId)) +
          First(getScoringByResponseItem(I.item, question8LinkId)) +
          First(getScoringByResponseItem(I.item, question9LinkId)) +
          First(getScoringByResponseItem(I.item, question10LinkId)),
    authoredDate: I.authored,
    lastUpdated: I.meta.lastUpdated.value
  }
  sort by date desc, lastUpdated desc