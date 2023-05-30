library Common_LogicLibrary version '1.0.0'

using FHIR version '4.0.0'

include "FHIRHelpers" version '4.0.0' called FHIRHelpers

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------
// Returns a text representation of a dateTime using the CQL `ToString` function.
// @param d - a FHIR dateTime to get text for
// @returns {System.String} the text representation of the dateTime
define function DateTimeText(d FHIR.dateTime):
  ToString(d.value)


// Extract of the link IDs of each item in the Questionnaire
define function GetItemLinkIds(questionnaire FHIR.Questionnaire):
  (questionnaire) Q
  let item: Q.item
  return item.linkId.value

// Get matched questionnaire based on questionnaire name or URL
define function GetMatchQuestionnaire(QuestionnaireName String, QuestionnaireURL String):
  ([Questionnaire] Q
    where 
    Q.url.value = QuestionnaireURL or 
    Lower(Q.name) = Lower(QuestionnaireName) or
    PositionOf(Lower(QuestionnaireName), Lower(Q.id)) != -1 or
    PositionOf(Lower(QuestionnaireName), Lower(Q.name)) != -1 or
    PositionOf(Lower(Q.name), Lower(QuestionnaireName)) != -1
  )

// Extract the answers from each item in the QuestionnaireResponse
define function GetCurrentResponses(responseItems List<FHIR.QuestionnaireResponse.Item>):
  (responseItems) I
  return Tuple {
    id: I.linkId.value,
    answer: I.answer.value[0] // Assuming only one answer per question
  }


/* @param qIndex, question index,
 * @param qId, question id, e.g. linkId
 * @return score for the question
 */
define function getQuestionScore(
  questionnaire FHIR.Questionnaire,
  responseItems List<FHIR.QuestionnaireResponse.Item>,
  qIndex Integer,
  qId String, 
  extensionIndex Integer
):
    (First(getResponseByQuestionId(responseItems, qId))) qResponse
    let
      qAnswerOptionCode: getAnswerOptionCodeValue(questionnaire, qIndex),
      qResponseIndex: if qResponse is not null then IndexOf(qAnswerOptionCode, qResponse.code.value as String) else -1,
      extensionItem: questionnaire.item[qIndex].answerOption[qResponseIndex].extension
      return
        if qResponseIndex != -1 then
          if extensionItem is not null then
            // TODO use matched url for answer extension instead of a index here
            extensionItem[extensionIndex].value.value as Integer
          else 0 as Integer
        else
          0 as Integer


/*
 @param question linkId of type FHIR.String
 @return answer element value with that linkId
 */
define function getResponseByQuestionId(responseItems List<FHIR.QuestionnaireResponse.Item>, qid String):
  (
    (GetCurrentResponses(responseItems)) R
    where (PositionOf(R.id, qid) != -1 or PositionOf(qid, R.id) != -1)
  ) CR 
  return if CR is not null then CR.answer else null

/*
 * retrieve questionnaire responses matched to the target questionnaire
 * @param responses as FHIR.QuestionnaireResponse
 * @param questionnaire as FHIR.Questionnaire to match against
 * @param keyword as String to match in the questionnaire element of the responses
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

define function getResponsesByQuestionnaire(currentQuestionnaire FHIR.Questionnaire, responses List<FHIR.QuestionnaireResponse.Item>, scoringQuestionId String):
  (currentQuestionnaire.item o where o.linkId.value != 'introduction' and o.linkId.value != scoringQuestionId) I 
  return {
      linkId: I.linkId.value,
      question: I.text.value,
      answer: First(GetResponseAnswerByLinkId(I.linkId.value, responses))
    }



/*
 *retrieve concept code of the selected answer option
 * @param question index of type FHIR.Integer
 * @return code value for the answer
 */
define function getAnswerOptionCodeValue(currentQuestionnaire FHIR.Questionnaire, qIndex Integer):
  if currentQuestionnaire.item[qIndex] is not null then
    currentQuestionnaire.item[qIndex].answerOption.value.code.value
  else
    null

/*
 * retrieve answer value by response item
 * @param linkId as String
 * @param responses as a list of FHIR.QuestionnaireResponse.Item
 */

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

define function GetArrayAnswerByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where PositionOf(r.linkId.value, linkId) != -1 or PositionOf(linkId, r.linkId.value) != -1) I
  return I.answer


define function GetResponseAnswerByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where PositionOf(r.linkId.value, linkId) != -1 or PositionOf(linkId, r.linkId.value) != -1) I
  return case
      //answer in FHIR coding format 
      when I.answer[0].value.display is not null then I.answer[0].value.display.value
      else I.answer[0].value.value
    end

/*
 * retrieve answer value FHIR object by response item
 * @param linkId as String
 * @param responses as a list of FHIR.QuestionnaireResponse.Item
 */
define function GetResponseValueByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where r.linkId.value = linkId) I
  return I.answer[0].value

/*
 * retrieve the numeric value for the answer from extension
 * @param a list of elements of type FHIR.Extension
 * @return the value as Integer
 */
define function getAnswerOptionExtensionValue(extList List<FHIR.Extension>):
  (extList e where e.url = 'http://hl7.org/fhir/StructureDefinition/ordinalValue')[0].value.value as Integer

/*
 * retrieve the numeric value for the answer based on value code
 * @param questionnaire as FHIR.Questionnaire where code in question is queried
 * @param code as String
 * @param index as Integer, this is extension index
 * @return the value as Integer
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
 * @param questionnaire as FHIR.Questionnaire where answer option code based on link id will be queried
 * @param responses as a list of FHIR.QuestionnaireResponse.Item
 * @param linkId as String
 * @return score in Integer
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
 * retrieve responses in a list of Tuple of formatted question and answer
 * @param questionnaireItems as a list of FHIR.Questionnaire.Item
 * @param responses as a list FHIR.QuestionnaireResponse.Item
 * @param scoringQuestionId as String
 */
define function FormattedResponsesByQuestionnaire(questionnaireItems List<FHIR.Questionnaire.Item>, responses List<FHIR.QuestionnaireResponse.Item>, scoringQuestionId String):
  ((questionnaireItems) O where O.linkId.value != 'introduction' and O.linkId.value != scoringQuestionId) Q
    let
      answerText: GetResponseAnswerByLinkId(Q.linkId.value, responses),
      answerValue: GetResponseValueByLinkId(Q.linkId.value, responses)
    return {
      id: Q.linkId.value,
      answer: if answerText is not null then First(answerText) else null,
      value: if answerValue is not null then First(answerValue) else null,
      question: if Q.linkId.value = scoringQuestionId then '<b>' + Q.text.value + '</b>' else Q.text.value,
      text: Q.text.value
    }

define function FormattedQuestionnaireResponses(responseItems List<FHIR.QuestionnaireResponse.Item>, scoringQuestionId String):
  ((responseItems) Q where Q.linkId.value != scoringQuestionId) I 
  return {
      linkId: I.linkId.value,
      answer: case
        //answer in FHIR coding format 
        when I.answer[0].value.display is not null then I.answer[0].value.display.value
        else I.answer[0].value.value
      end,
      question: I.text.value
  }

define function GetAnswerLinkIdsByQuestionnaire(currentQuestionnaire FHIR.Questionnaire, scoringQuestionId String):
  (currentQuestionnaire C) O
  let
    responseItems: ((O.item) I where IndexOf(AnswerQuestionTypes, I.type.value) != -1 and I.linkId.value != scoringQuestionId)
    return responseItems.linkId.value
