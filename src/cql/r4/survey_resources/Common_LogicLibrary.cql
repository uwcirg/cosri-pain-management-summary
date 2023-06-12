library Common_LogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers


define AnswerQuestionTypes: {
    'boolean',
    'decimal',
    'integer',
    'date',
    'dateTime',
    'time',
    'string',
    'text',
    'choice',
    'open-choice'
}

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------
// Returns a text representation of a dateTime using the CQL `ToString` function.
// @param d - a FHIR dateTime to get text for
// @returns {System.String} the text representation of the dateTime
define function DateTimeText(d FHIR.dateTime):
  ToString(d.value)


// Extract of the link IDs of each item in the Questionnaire
// @param questionnaire, of type FHIR.Questionnaire
// @return {System.List} a list of link id values
define function GetItemLinkIds(questionnaire FHIR.Questionnaire):
  (questionnaire) Q
  let item: Q.item
  return item.linkId.value

// Get matched questionnaire based on questionnaire name or questionnaire URL
// @param QuestionnaireName, of type String
// @param QuestionnaireURL, of type String
// @return {System.List} a list of FHIR.Questionnaire that matches the questionnaire name or URL
define function GetMatchQuestionnaire(QuestionnaireName String, QuestionnaireURL String):
  ([Questionnaire] Q
    where 
    Q.url.value = QuestionnaireURL or 
    Lower(Q.name) = Lower(QuestionnaireName) or
    PositionOf(Lower(QuestionnaireName), Lower(Q.id)) != -1 or
    PositionOf(Lower(QuestionnaireName), Lower(Q.name)) != -1 or
    PositionOf(Lower(Q.name), Lower(QuestionnaireName)) != -1
  )

// Extract the answer from each item in the QuestionnaireResponse
// @param responseItems, of type List<FHIR.QuestionnaireResponse.Item>
// @return {System.List} of tuples of linkId and answer values
define function GetCurrentResponses(responseItems List<FHIR.QuestionnaireResponse.Item>):
  (responseItems) I
  return Tuple {
    linkId: I.linkId.value,
    answer: I.answer.value[0] // Assuming only one answer per question
  }

/*
 * retrieve questionnaire responses matched to the target questionnaire
 * @param responses, of type FHIR.QuestionnaireResponse
 * @param questionnaire, of type FHIR.Questionnaire, questionnaire to match against
 * @param keyword, of type String to match in the questionnaire element of the Questionnaire
 * @return {System.List<FHIR.QuestionnaireResponse>}
 */
define function MatchedReponsesByQuestionnaire(responses List<FHIR.QuestionnaireResponse>, currentQuestionnaire FHIR.Questionnaire, keyword String):
  ((responses) Q
    where 
    (
      (
        PositionOf(Lower(currentQuestionnaire.name), Lower(Q.questionnaire.value)) != -1 or
        PositionOf(Lower(currentQuestionnaire.id), Lower(Q.questionnaire.value)) != -1 or 
        PositionOf(Lower(keyword), Lower(Q.questionnaire.value)) != -1
      ) and 
      Q.status.value = 'completed')
    sort by authored desc 
  )

/*
 * retrieve list of Tuples containing question and its corresponding answer for a matched questionnaire
 * @param currentQuestionnaire, of type FHIR.Questionnaire
 * @param responses, of type FHIR.QuestionnaireResponse.Item
 * @param ScoringQuestionId, question link id for question containing score 
 * @return {System.List<Tuple>}
 */
define function getResponsesByQuestionnaire(currentQuestionnaire FHIR.Questionnaire, responses List<FHIR.QuestionnaireResponse.Item>, scoringQuestionId String):
  (currentQuestionnaire.item o 
    where o.linkId.value != 'introduction' and 
    (PositionOf(o.linkId.value, scoringQuestionId) = -1 or PositionOf(scoringQuestionId, o.linkId.value) = -1)
  ) I 
  let
   answer: First(GetResponseAnswerByLinkId(I.linkId.value, responses))
  return {
      linkId: I.linkId.value,
      question: I.text.value,
      answer: answer,
      answerText: I.answerOption[ToInteger(answer)].value.display.value
    }

/*
 * retrieve concept code of a selected answer option from a Questionnaire
 * @param currentQuestionnaire, of type FHIR.Questionnaire
 * @param qIndex, question index, of type FHIR.Integer
 * @return {System.String} code value for the answer
 */
define function getAnswerOptionCodeValue(currentQuestionnaire FHIR.Questionnaire, qIndex Integer):
  if currentQuestionnaire.item[qIndex] is not null then
    currentQuestionnaire.item[qIndex].answerOption.value.code.value
  else
    null

/* retrieve a list of answer values from the QuestionnaireResponse that matches the provided linkId
 * @param linkId, of type String
 * @param responses, list of questionnaireResponse Item, of type List<FHIR.QuestionnaireResponse.Item>
 * @return {List<String|Integer|Float>}
 */
define function GetResponseAnswerByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where PositionOf(r.linkId.value, linkId) != -1 or PositionOf(linkId, r.linkId.value) != -1) I
  return case
      //answer in FHIR coding format 
      when I.answer[0].value.display is not null then I.answer[0].value.display.value
      else I.answer[0].value.value
    end

/*
 * retrieve single-valued answer to the question in a QuestionnaireResponse
 * @param linkId, of type String
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @return {boolean|decimal|integer|date|dateTime|time|string|uri|Attachment|Coding|SimpleQuantity|Reference(Any)}
 */
define function GetResponseValueByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where PositionOf(r.linkId.value, linkId) != -1 or PositionOf(linkId, r.linkId.value) != -1) I
  return I.answer[0].value

/*
 * retrieve the numeric value for the answer from a FHIR extension
 * @param extList, a list of elements of type FHIR.Extension
 * @return {System.Integer}
 */
define function getAnswerOptionExtensionValue(extList List<FHIR.Extension>):
  (extList e where e.url = 'http://hl7.org/fhir/StructureDefinition/ordinalValue')[0].value.value as Integer

/*
 * retrieve the numeric value for the answer based on value code
 * @param questionnaire as FHIR.Questionnaire where code in question is queried
 * @param code as String
 * @param index as Integer, this is extension index
 * @return {System.Integer}
 */
// define function getAnswerValueByCode(questionnaire FHIR.Questionnaire, code String):
//   (singleton from ((questionnaire.item.answerOption) Q where Q.value.code = code)) a
//   let 
//     extensionItem: a.extension
//   return if extensionItem is not null then getAnswerOptionExtensionValue(extensionItem) else (0 as Integer)
// TODO don't use numeric index to determine which extension to use, use matched system URL
define function getAnswerValueByCode(questionnaire FHIR.Questionnaire, code String, extensionIndex Integer):
  ((questionnaire.item.answerOption) Q where Q.value.code = code) a
  return a.extension[extensionIndex].value.value as Integer

/*
 * retrieve the numeric value for the score for an questionnaire response item
 * @param questionnaire, of type FHIR.Questionnaire, where answer option code based on link id will be queried
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @param linkId, of type String
 * @return {System.Integer}
 */
define function getScoringByResponseItem(questionnaire FHIR.Questionnaire, responses List<FHIR.QuestionnaireResponse.Item>, linkId String, extensionIndex Integer):
  (singleton from (((responses) o where PositionOf(linkId, o.linkId.value) != -1 or PositionOf(o.linkId.value, linkId) != -1) I
  return 
    if I is null then ({null as Integer})
    else
      if I.answer[0].value.code is not null and questionnaire is not null then getAnswerValueByCode(questionnaire, I.answer[0].value.code.value, extensionIndex) 
      else if I.answer[0].value.value is not null then I.answer[0].value.value 
      else 0 as Integer))

/* 
 * retrieve questionnaire responses in a list of Tuple of formatted question and answer
 * @param questionnaireItems, of type List<FHIR.Questionnaire.Item>
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @param scoringQuestionId as String, linkId for the question containing the score
 * @return {System.List<Tuple>}
 */
define function FormattedResponsesByQuestionnaire(
  questionnaireItems List<FHIR.Questionnaire.Item>,
  responses List<FHIR.QuestionnaireResponse.Item>, scoringQuestionId String):
  ((questionnaireItems) O where 
    O.linkId.value != 'introduction' and (
      PositionOf(O.linkId.value,scoringQuestionId) = -1 or PositionOf(scoringQuestionId, O.linkId.value) = -1
    )
  ) Q
    let
      answerText: GetResponseAnswerByLinkId(Q.linkId.value, responses),
      answerValue: GetResponseValueByLinkId(Q.linkId.value, responses)
    return {
      linkId: if Q.linkId.value is not null then Q.linkId.value else 'n/a',
      answer: if answerText is not null then First(answerText) else null,
      value: if answerValue is not null then First(answerValue) else null,
      question: if Q.linkId.value = scoringQuestionId then '<b>' + Q.text.value + '</b>' else Q.text.value,
      text: Q.text.value
    }

/* retrieve a list of questionnaire response including answer and question text
 * @param List<FHIR.QuestionnaireResponse.Item>
 * @return {System.List<Tuple>}
 */
define function FormattedQuestionnaireResponses(responseItems List<FHIR.QuestionnaireResponse.Item>):
  ((responseItems) Q) I 
  return {
      linkId: if I.linkId.value is not null then I.linkId.value else 'n/a',
      answer: case
        //answer in FHIR coding format 
        when I.answer[0].value.display is not null then I.answer[0].value.display.value
        else I.answer[0].value.value
      end,
      question: I.text.value
  }
