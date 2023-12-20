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


// Extract id from linkId element of each item in the Questionnaire
// @param questionnaire, of type FHIR.Questionnaire
// @return {System.List} a list of link id values
define function GetItemLinkIds(questionnaire FHIR.Questionnaire):
  (questionnaire) Q
  let item: Q.item
  return item.linkId.value

// Get matched questionnaire based on questionnaire ID, questionnaire name or questionnaire URL
// @param QuestionnaireID, of type String, id of the questionnaire
// @param QuestionnaireName, of type String
// @param QuestionnaireURL, of type String
// @return {System.List} a list of matched FHIR.Questionnaire
define function GetMatchQuestionnaire(QuestionnaireID String, QuestionnaireName String, QuestionnaireURL String):
  ([Questionnaire] Q
    where 
    Q.url.value = QuestionnaireURL or
    Q.id = QuestionnaireID or
    Lower(Q.name) = Lower(QuestionnaireName) or
    PositionOf(Lower(QuestionnaireName), Lower(Q.name)) != -1 or
    PositionOf(Lower(Q.name), Lower(QuestionnaireName)) != -1
  )

// Extract the id and value from each answer item in the QuestionnaireResponse
// @param responseItems, of type List<FHIR.QuestionnaireResponse.Item>
// @return {System.List} of tuples of id and answer values
define function GetCurrentResponses(responseItems List<FHIR.QuestionnaireResponse.Item>):
  (responseItems) I
  return Tuple {
    linkId: I.linkId.value,
    answer: I.answer.value[0] // Assuming only one answer per question
  }

/*
 * retrieve questionnaire responses to a questionnaire matched on questionnaire id, questionnaire name or specified keyword
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
 * retrieve concept code of a specified answer option by numeric index from a questionnaire
 * @param currentQuestionnaire, of type FHIR.Questionnaire
 * @param qIndex, numeric index, of type FHIR.Integer
 * @return {System.String} code value for the answer
 */
define function getAnswerOptionCodeValue(currentQuestionnaire FHIR.Questionnaire, qIndex Integer):
  if currentQuestionnaire.item[qIndex] is not null and 
    currentQuestionnaire.item[qIndex].answerOption.value.code is not null
  then
    currentQuestionnaire.item[qIndex].answerOption.value.code.value
  else
    null

/* retrieve answer value from the QuestionnaireResponse that matches the provided id, aka linkId, i.e. QuestionnaireResponse.item.answer.value[x]
 * @param linkId, of type String
 * @param responses, list of questionnaireResponse Item, of type List<FHIR.QuestionnaireResponse.Item>
 * @return {List<String|Integer|Decimal>}
 */
define function GetResponseAnswerValueByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where PositionOf(r.linkId.value, linkId) != -1 or PositionOf(linkId, r.linkId.value) != -1) I
  return case
      //answer in FHIR coding format 
      when I.answer[0].value.display is not null then I.answer[0].value.display.value
      when I.answer[0].value.value is not null then I.answer[0].value.value
      else null
    end

// retrieve a list of answer element from a questionnaire response item matched by id, aka linkId, i.e. QuestionnaireResponse.item.answer
/* @param linkId, of type String
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @return {List<QuestionnaireResponse.item.answer>}
 */
define function GetArrayAnswerByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where PositionOf(r.linkId.value, linkId) != -1 or PositionOf(linkId, r.linkId.value) != -1) I
  return I.answer

/*
 * retrieve answer choice element, i.e. QuestionnaireResponse.Item.value in a QuestionnaireResponse matched by id, aka linkId
 * @param linkId, of type String
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @return {boolean|decimal|integer|date|dateTime|time|string|uri|Attachment|Coding|SimpleQuantity|Reference(Any)}
 */
define function GetResponseAnswerChoiceByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where PositionOf(r.linkId.value, linkId) != -1 or PositionOf(linkId, r.linkId.value) != -1) I
  return I.answer[0].value

/*
 * retrieve the numeric value for the answer option from a FHIR extension
 * @param extList, a list of elements of type FHIR.Extension
 * @return {System.Integer}
 */
define function getAnswerOptionExtensionValue(extList List<FHIR.Extension>):
  (extList e where e.url = 'http://hl7.org/fhir/StructureDefinition/ordinalValue')[0].value.value as Integer

/*
 * retrieve the numeric value for the answer extension option based on value Coding, i.e. Questionnaire.item.answerOption.value.code
 * @param questionnaire as FHIR.Questionnaire against which code is queried
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
  ((questionnaire.item.answerOption) Q where Q.value is not null and Q.value.code is not null and Q.value.code = code) a
  return a.extension[extensionIndex].value.value as Integer

/*
 * retrieve the numeric value for an answer option item matched by id aka linkId
 * this will first query matched answer item in a FHIR Questionnaire for the numeric value of the extension option based on value Coding
 * if Coding not present, it will return the answer's value, QuestionnaireResponse.item.answer.value[x]
 * @param questionnaire, of type FHIR.Questionnaire
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @param linkId, of type String
 * @return {System.Integer}
 */
define function getNumericValueByResponseItem(questionnaire FHIR.Questionnaire, responses List<FHIR.QuestionnaireResponse.Item>, linkId String, extensionIndex Integer):
  (singleton from ((responses) o where PositionOf(linkId, o.linkId.value) != -1 or PositionOf(o.linkId.value, linkId) != -1)) I
  return 
    if I is null then null
    else
      // if answering is Coding, retrieve the corresponding numeric value by querying the questionnaire
      if I.answer[0].value.code is not null and questionnaire is not null then getAnswerValueByCode(questionnaire, I.answer[0].value.code.value, extensionIndex) 
      else if I.answer[0].value.value is not null then I.answer[0].value.value as Integer
      else null


/*
 * retrieve the decimal answer value in a QuestionnaireResponse Item matched by id aka linkId, i.e. QuestionnaireResponse.item[linkId = linkId].answer.value[x]
 * @param questionnaire, of type FHIR.Questionnaire
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @param linkId, of type String, to be matched
 * @return {decimal}
 */
define function geDecimalValueByResponseItem(responses List<FHIR.QuestionnaireResponse.Item>, linkId String):
  (singleton from ((responses) o where PositionOf(linkId, o.linkId.value) != -1 or PositionOf(o.linkId.value, linkId) != -1)) I
  return 
    if I is null then null
    else
      if I.answer[0].value.value is not null then I.answer[0].value.value as Decimal
      else null

/* 
 * retrieve the number of answered responses
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @param scoringQuestionId as String, id, aka, linkId for the question containing the score, which will be excluded
 * @return {System.integer}
 */
define function getTotalAnsweredItems(responses List<FHIR.QuestionnaireResponse.Item>, scoringQuestionId String):
   case
      when scoringQuestionId is not null then
        Length(
          ((FormattedQuestionnaireResponses(responses)) O where 
            (PositionOf(O.linkId, scoringQuestionId) = -1 or 
             PositionOf(scoringQuestionId, O.linkId) = -1)) A
            where A.answer is not null
        )
      else
        Length(((FormattedQuestionnaireResponses(responses)) A where A.answer is not null))
    end

/* 
 * retrieve response for each question in a list of Tuple of formatted question and answer
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
      answerText: GetResponseAnswerValueByLinkId(Q.linkId.value, responses),
      answerValue: GetResponseAnswerChoiceByLinkId(Q.linkId.value, responses)
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
        when I.answer[0].value.display is not null and I.answer[0].value.display.value is not null then 
          I.answer[0].value.display.value
        when I.answer[0].value.value is not null then I.answer[0].value.value
        else
          null
      end,
      question: I.text.value
  }
