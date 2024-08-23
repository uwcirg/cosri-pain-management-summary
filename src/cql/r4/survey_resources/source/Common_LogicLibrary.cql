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
// @returns System.String, the text representation of the dateTime
define function DateTimeText(d FHIR.dateTime):
  ToString(d.value)


// Extract value from linkId element of each item in the Questionnaire, i.e. Questionnaire.item.linkId
// @param questionnaire, of type FHIR Questionnaire
// @return {System.String} a list of link id values
define function GetItemLinkIds(questionnaire FHIR.Questionnaire):
  (questionnaire) Q
  let item: Q.item
  return item.linkId.value

// Get matched FHIR Questionnaire based on questionnaire ID, or supplied keyword to match
// @param QuestionnaireID, of type String, id of the questionnaire
// @param keyword, of type String
// @return {FHIR.Questionnaire}, a list of matched FHIR.Questionnaire
define function GetMatchQuestionnaire(QuestionnaireID String, keyword String):
  ([Questionnaire] Q
    where 
    Q.id = QuestionnaireID or
    Lower(Q.name) = Lower(keyword) or
    PositionOf(Lower(keyword), Lower(Q.name)) != -1 or
    PositionOf(Lower(Q.name), Lower(keyword)) != -1 
  )

/*
 * retrieve a list of completed FHIR QuestionnaireResponse for a Questionnaire, matched on questionnaire id or questionnaire name, in the questionnaire element
 * @param responses, of type FHIR.QuestionnaireResponse
 * @param questionnaire, of type FHIR.Questionnaire, questionnaire to match against
 * @return {System.List<FHIR.QuestionnaireResponse>}
 */
define function MatchedReponsesByQuestionnaire(responses List<FHIR.QuestionnaireResponse>, currentQuestionnaire FHIR.Questionnaire):
  ((responses) Q
    where 
    (
      (
        PositionOf(Lower(currentQuestionnaire.name), Lower(Q.questionnaire.value)) != -1 or
        PositionOf(Lower(currentQuestionnaire.id), Lower(Q.questionnaire.value)) != -1
      ) and 
      Q.status.value = 'completed')
    sort by authored desc 
  )

/* retrieve answer text from the QuestionnaireResponse answer item that has the provided id, aka linkId, i.e. QuestionnaireResponse.item.answer.value[x]
 * @param linkId, of type String
 * @param responses, list of questionnaireResponse Item, of type List<FHIR.QuestionnaireResponse.Item>
 * @return {List<String|Integer|Decimal>}
 */
define function GetResponseAnswerTextByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where PositionOf(r.linkId.value, linkId) != -1 or PositionOf(linkId, r.linkId.value) != -1) I
  return case
      //answer in FHIR coding format 
      when I.answer[0].value.display is not null then I.answer[0].value.display.value
      when I.answer[0].value.value is not null then I.answer[0].value.value
      else null
    end

// retrieve a list of answer element from a questionnaire response item that has the provided id, aka linkId, i.e. QuestionnaireResponse.item[linkId = linkId].answer
/* @param linkId, of type String
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @return {QuestionnaireResponse.item.answer}
 */
define function GetArrayAnswerByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where PositionOf(r.linkId.value, linkId) != -1 or PositionOf(linkId, r.linkId.value) != -1) I
  return I.answer

/*
 * retrieve answer value element, i.e. QuestionnaireResponse.Item.value in a QuestionnaireResponse matched by id, aka linkId
 * @param linkId, of type String
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @return {boolean|decimal|integer|date|dateTime|time|string|uri|Attachment|Coding|SimpleQuantity|Reference(Any)}
 */
define function GetResponseAnswerValueByLinkId(linkId String, responses List<FHIR.QuestionnaireResponse.Item>):
  (responses r where PositionOf(r.linkId.value, linkId) != -1 or PositionOf(linkId, r.linkId.value) != -1) I
  return I.answer[0].value

/*
 * retrieve the numeric value for the answer option from a FHIR extension
 * @param extList, a list of elements of type FHIR.Extension
 * @return {System.Integer}
 */
define function GetAnswerOptionExtensionValue(extList List<FHIR.Extension>):
  (extList e where e.url = 'http://hl7.org/fhir/StructureDefinition/ordinalValue')[0].value.value as Integer

/*
 * retrieve the numeric value for answer extension option based on value Coding, i.e. Questionnaire.item.answerOption.value.code
 * @param questionnaire as FHIR.Questionnaire against which answerOption code is queried
 * @param code as String
 * @param index as Integer, this is extension index
 * @return {System.Integer}
 */
// define function getAnswerValueByQuestionnaireItem(questionnaire FHIR.Questionnaire, code String):
//   (singleton from ((questionnaire.item.answerOption) Q where Q.value.code = code)) a
//   let 
//     extensionItem: a.extension
//   return if extensionItem is not null then getAnswerOptionExtensionValue(extensionItem) else (0 as Integer)
// TODO don't use numeric index to determine which extension to use, use matched system URL
define function GetAnswerValueByQuestionnaireItem(questionnaire FHIR.Questionnaire, code String, extensionIndex Integer):
  ((questionnaire.item.answerOption) Q where Q.value is not null and Q.value.code is not null and Q.value.code = code) a
  return if a.extension[extensionIndex].value is not null then a.extension[extensionIndex].value.value as Integer
  else GetAnswerValueByCode(a.value.code)

define function GetAnswerValueByCode(code String):
    case
      when code = 'LA6111-4' then 0
      when code = 'LA6112-2' then 1
      when code = 'LA6113-0' then 2
      when code = 'LA6114-8' then 3
      when code = 'LA6115-5' then 4
      when code = 'LA10137-0' then 5
      when code = 'LA10138-8' then 6
      when code = 'LA10139-6' then 7
      when code = 'LA10140-4' then 8
      when code = 'LA10141-2' then 9
      when code = 'LA13942-0' then 10
      when code = 'LA6568-5' then 0
      when code = 'LA6569-3' then 1
      when code = 'LA6570-1' then 2
      when code = 'LA18938-3' then 2
      when code = 'LA6571-9' then 3
      when code = 'STOP-0-0' then 1
      when code = 'STOP-0-1' then 0
      when code = 'STOP-0-0' then 1
      when code = 'STOP-0-1' then 0
      when code = 'STOP-0-0' then 1
      when code = 'STOP-0-1' then 0
      when code = 'STOP-1-0' then 1
      when code = 'STOP-1-1' then 0
      when code = 'STOP-2-0' then 1
      when code = 'STOP-2-1' then 0
      when code = 'STOP-3-0' then 1
      when code = 'STOP-3-1' then 0
      when code = 'LA33-6' then 1
      when code = 'LA32-8' then 0
      else null
    end
/*
 * retrieve the numeric value for an answer option item matched by id aka linkId
 * this will query matched answer item in a FHIR Questionnaire for the numeric value of the extension option, i.e. Item.extension[index].value based on value Coding, Item.value.code
 * example:
 *  {
      "extension": [
        {
          "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
          "valueDecimal": 1
        },
        {
          "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
          "valueString": "1"
        }
      ],
      "valueCoding": {
        "code": "LA6569-3",
        "display": "Several days"
      }
    }
 * if Coding not present, it will return the answer's value, QuestionnaireResponse.item.answer.value[x]
 * @param questionnaire, of type FHIR.Questionnaire
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @param linkId, of type String
 * @return {System.Integer}
 */
define function GetNumericValueByResponseItemCode(questionnaire FHIR.Questionnaire, responses List<FHIR.QuestionnaireResponse.Item>, linkId String, extensionIndex Integer):
  (singleton from ((responses) o where PositionOf(linkId, o.linkId.value) != -1 or PositionOf(o.linkId.value, linkId) != -1)) I
  return 
    if I is null then null
    else
      // if answering is Coding, retrieve the corresponding numeric value by querying the questionnaire
      if questionnaire is not null and I.answer[0].value.code is not null then GetAnswerValueByQuestionnaireItem(questionnaire, I.answer[0].value.code.value, extensionIndex) 
      else GetAnswerValueByCode(I.answer[0].value.code)

/*
 * ASSUME response is in number, retrieve the numeric answer value in a QuestionnaireResponse Item matched by id aka linkId, i.e. QuestionnaireResponse.item[linkId = linkId].answer.value[x]
 * @param questionnaire, of type FHIR.Questionnaire
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @param linkId, of type String, to be matched
 * @return {integer}
 */
define function GetNumericValueByResponseItem(responses List<FHIR.QuestionnaireResponse.Item>, linkId String):
  (singleton from ((responses) o where PositionOf(linkId, o.linkId.value) != -1 or PositionOf(o.linkId.value, linkId) != -1)) I
  return 
    if I is null then null
    else
      if I.answer[0].value.value is not null then I.answer[0].value.value as Integer
      else null

/* 
 * retrieve the number of answered responses
 * @param responses, of type List<FHIR.QuestionnaireResponse.Item>
 * @param scoringQuestionId as String, id, aka, linkId for the response containing the score, which will be excluded from total answered responses
 * @return {System.integer}
 */
define function GetTotalAnsweredItems(responses List<FHIR.QuestionnaireResponse.Item>, scoringQuestionId String):
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
 * @return {Tuple<{
  linkId, answer, value, question
 }>}
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
      answerText: GetResponseAnswerTextByLinkId(Q.linkId.value, responses),
      answerValue: GetResponseAnswerValueByLinkId(Q.linkId.value, responses)
    return {
      linkId: if Q.linkId.value is not null then Q.linkId.value else 'n/a',
      answer: if answerText is not null then First(answerText) else null,
      value: if answerValue is not null then First(answerValue) else null,
      question: if Q.linkId.value = scoringQuestionId then '<b>' + Q.text.value + '</b>' else Q.text.value,
      text: Q.text.value
    }

/* retrieve a list of questionnaire response including answer and question text
 * @param List<FHIR.QuestionnaireResponse.Item>
 * @return {Tuple<linkId, answer, question>}
 */
define function FormattedQuestionnaireResponses(responseItems List<FHIR.QuestionnaireResponse.Item>):
  ((responseItems) Q) I 
  return {
      linkId: if I.linkId.value is not null then I.linkId.value else 'n/a',
      answer: case
        // GAD7 score item
        when I.linkId.value = '/70274-6' then I.answer[0].value.value
        when I.linkId.value = '70274-6' then I.answer[0].value.value
        // PHQ8 score item
        when I.linkId.value = '/44261-6' then I.answer[0].value.value
        when I.linkId.value = '44261-6' then I.answer[0].value.value
        // PHQ 4 score item
        when I.linkId.value = '70272-0' then I.answer[0].value.value
        when I.linkId.value = '/70272-0' then I.answer[0].value.value
        // PEG score item
        when I.linkId.value = '91147-9' then I.answer[0].value.value
        when I.linkId.value = '/91147-9' then I.answer[0].value.value
        // PROMIS score item 85523-9
        when I.linkId.value = '85523-9' then I.answer[0].value.value
        when I.linkId.value = '/85523-9' then I.answer[0].value.value
        // PC-PTSD score item 102017-1
        when I.linkId.value = '102017-1' then I.answer[0].value.value
        when I.linkId.value = '/102017-1' then I.answer[0].value.value
        // STOP score item
        when I.linkId.value = 'STOP-score' then I.answer[0].value.value
        // HACK, address GE questionnaire Other answer
        when 
             PositionOf('GE', I.linkId.value) != -1 and
             I.answer[1].value is not null and
             I.answer[1].value.value is not null
             then
          I.answer[1].value.value
        // answer in FHIR coding format 
        // TODO check data type to see if answer value is of type Coding, i.e. I.answer[0].value is Coding, the version of CQL execution engine lib doesn't support data type check
        when I.answer[0].value is not null and I.answer[0].value.display is not null and I.answer[0].value.display.value is not null then 
          I.answer[0].value.display.value
        when I.answer[0].value is not null and I.answer[0].value.value is not null then I.answer[0].value.value
        else
          null
      end,
      question: I.text.value
  }
