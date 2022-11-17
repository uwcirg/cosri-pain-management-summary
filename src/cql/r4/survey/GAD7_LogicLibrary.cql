library GAD7LogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

// -----------------------------------------------------------------------------
// CODESYSTEMS, VALUE SETS, CODES, AND CONCEPTS
// -----------------------------------------------------------------------------

codesystem "LOINC": 'http://loinc.org'
//codesystem "LOCAL": 'http://www.cdc.gov/ncbddd/fasd'


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

// We need to set the QuestionnaireURL parameter to an expression before we can use it
define CurrentQuestionnaireURL:
  QuestionnaireURL

// Load Questionnaire
define Gad7Questionnaire:
  singleton from ([Questionnaire] Q
    where (
      Q.url.value = CurrentQuestionnaireURL or
      PositionOf(Lower(QuestionnaireName), Lower(Q.id)) != -1 or
      PositionOf(Lower(QuestionnaireName), Lower(Q.name)) != -1 or
      Lower(Q.name) = Lower(QuestionnaireName)
    ))

// Extract of the link IDs of each item in the Questionnaire
define ItemLinkIds:
  Gad7Questionnaire Q
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
    seven: IndexOf(ItemLinkIds, question7LinkId)
  }

define QuestionnaireResponses:
  ([QuestionnaireResponse] QR
    where (
      QR.questionnaire.value = CurrentQuestionnaireURL or
      PositionOf(Gad7Questionnaire.id, QR.questionnaire.value)  != -1)
    sort by authored desc
  )

// Load the most recent completed questionnaireResponse
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
  if Gad7Questionnaire.item[qIndex] is not null then
    Gad7Questionnaire.item[qIndex].answerOption.value.code.value
  else
    null

/*
 * retrieve the numeric value for the answer from extension
 * @param a list of elements of type FHIR.Extension
 * @return the value as Integer
 */
define function getAnswerOptionExtensionValue(extList List<FHIR.Extension>):
  First(extList e where e.url = 'http://hl7.org/fhir/StructureDefinition/ordinalValue').value.value as Integer

/*
 * retrieve the numeric value for the answer based on value code
 * @param code as String
 * @return the value as Integer
 */
define function getAnswerValueByCode(code String):
  ((Gad7Questionnaire.item.answerOption) Q where Q.value.code = code) a
  return a.extension[1].value.value as Integer

/* @param qIndex, question index,
 * @param qId, question id, e.g. linkId
 * @return score for the question
 */
define function getCurrentQuestionScore(qIndex Integer, qId String):
    (getCurrentResponseByQuestionId(qId)[0]) qResponse
    let
      qAnswerOptionCode: getAnswerOptionCodeValue(qIndex),
      qResponseIndex: if qResponse is not null then IndexOf(qAnswerOptionCode, qResponse.code.value as String) else -1,
      extensionItem: Gad7Questionnaire.item[qIndex].answerOption[qResponseIndex].extension
      //return extensionItem[1].value.value as Integer
      return
        if qResponseIndex != -1 then
          if extensionItem is not null then
            extensionItem[1].value.value as Integer
          else 0 as Integer
        else
          0 as Integer
      
// Question 1
define Gad7ScoreQuestion1:
  getCurrentQuestionScore(IndexOfQuestion.one, question1LinkId)

// Question 2
define Gad7ScoreQuestion2:
  getCurrentQuestionScore(IndexOfQuestion.two, question2LinkId)

// Question 3
define Gad7ScoreQuestion3:
  getCurrentQuestionScore(IndexOfQuestion.three, question3LinkId)

// Question 4
define Gad7ScoreQuestion4:
  getCurrentQuestionScore(IndexOfQuestion.four, question4LinkId)

// Question 5
define Gad7ScoreQuestion5:
  getCurrentQuestionScore(IndexOfQuestion.five, question5LinkId)

// Question 6
define Gad7ScoreQuestion6:
  getCurrentQuestionScore(IndexOfQuestion.six, question6LinkId)

// Question 7
define Gad7ScoreQuestion7:
  getCurrentQuestionScore(IndexOfQuestion.seven, question7LinkId)

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

define function GetResponseAnswerByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where r.linkId.value = linkId) I
  return case
      //answer in FHIR coding format 
      when I.answer[0].value.display is not null then I.answer[0].value.display.value
      else I.answer[0].value.value
    end

define function getScoringByResponseItem(responses List<FHIR.QuestionnaireResponse.Item>, linkId String):
  First(((responses) o where o.linkId.value = linkId) I
  return 
    if I.answer[0].value.code is not null then getAnswerValueByCode(I.answer[0].value.code.value) else 0)

define function getResponsesByQuestionnaire(responses List<FHIR.QuestionnaireResponse.Item>):
  (Gad7Questionnaire.item o where o.linkId.value != 'introduction') I 
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
    score: 
          Coalesce(First(getScoringByResponseItem(I.item, question1LinkId)), 0) +
          Coalesce(First(getScoringByResponseItem(I.item, question2LinkId)), 0) +
          Coalesce(First(getScoringByResponseItem(I.item, question3LinkId)), 0) + 
          Coalesce(First(getScoringByResponseItem(I.item, question4LinkId)), 0) +
          Coalesce(First(getScoringByResponseItem(I.item, question5LinkId)), 0) +
          Coalesce(First(getScoringByResponseItem(I.item, question6LinkId)), 0) +
          Coalesce(First(getScoringByResponseItem(I.item, question7LinkId)), 0),
    authoredDate: I.authored,
    lastUpdated: I.meta.lastUpdated.value
  }
  sort by date desc, lastUpdated desc
