library OMTKLogic version '3.0.0'

/*
This library provides functionality for calculating Milligram Morphine
Equivalents (MME) for opioid medications, as described in the CDC Opioid
Prescribing Guideline.
The functionality in this library was developed based on the Java-based
implementation described [here](http://build.fhir.org/ig/cqframework/opioid-cds-r4/service-documentation.html#solution-component-3-core-logic-processing-java-class),
as well as the MME conversion calculation published as part of the CDC Opioid
Prescribing Guideline.
This version of the OMTKLogic library uses the OMTKData library as the
source for drug ingredient and strength information, rather than the
OMTK data source. This library has no external dependencies and so
can run in an environment that supports pure CQL.
NOTE: For performance, all terminology comparisons in this library use
direct integer comparison of the RxNorm codes.
This product uses publicly available data courtesy of the U.S. National Library of Medicine (NLM),
National Institutes of Health, Department of Health and Human Services; NLM is not responsible for
the product and does not endorse or recommend this or any other product.
Nelson SJ, Zeng K, Kilbourne J, Powell T, Moore R. Normalized names for clinical drugs: RxNorm at 6 years.
J Am Med Inform Assoc. 2011 Jul-Aug;18(4)441-8. doi: 10.1136/amiajnl-2011-000116.
Epub 2011 Apr 21. PubMed PMID: 21515544; PubMed Central PMCID: PMC3128404.
[Full text](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3128404/)
*/
/*
* Changelog
* 06/22/21
* Fix GetDailyDose for fentanyl & buprenorphine patches based on guideline here:
* https://drive.google.com/drive/u/1/folders/1SQ7tufdYatX4qZeZtk6S5xWeNVC0zOQf
* see footnote 3 for buprenorphine and footnote 8 for fentanyl
* formulation used: quantity(patches) / days supplied * strength factor
* Adjust conversion factor for fentanyl patch from 2.4 to 7.2
*
* 09/13/21  Add conversion factors for oliceridine & benzhydrocodone; Update conversion factor to 0.3 for Meperidine IV form
* 09/13/21 Update conversion factors for fentanyl injection, mucosal spray and lozenge product (1, 0.18, 0.13 respectively)
* 09/13/21 Add conversion factor for benzhydrocodone
* 09/21/21 BugFix fix integer/decimal daily dose comparison when detetermine conversion factor for Methodone
* 12/01/21 Add conversion factor for Sufentanil, Alfentanil, and Remifentanil
* 12/21/21 Add conversion factor for Diphenoxylate
* 10/09/24 Change conversion factor for Hydromorphone (from 4 to 6), for Tramadol (from 0.1 to 0.2), for buprenorphine patch (from 1.8 X 7 = 12.6 to 2.2 X 7 = 15.4, as patch remains in place for 7 days)
*/

include OMTKData version '3.0.0' called OMTKData

codesystem "RXNORM": 'http://www.nlm.nih.gov/research/umls/rxnorm'

parameter ErrorLevel String default 'Warning'

/*
  Normalizes the input units to UCUM units
  The values listed here are the only ones currently present in the OMTK data
  Based on the HL7 UCUM subset here:
  http://download.hl7.de/documents/ucum/ucumdata.html
*/
define function ToUCUM(unit String):
  case unit
    when 'MG' then 'mg'
    when 'MG/ACTUAT' then 'mg/{actuat}'
    when 'MG/HR' then 'mg/h'
    when 'MG/ML' then 'mg/mL'
    else Message(null, true, 'OMTKLogic.ToUCUM.UnknownUnit', ErrorLevel, 'Unknown unit ' & unit)
  end

/*
  Calculates daily frequency given frequency within a period
*/
define function ToDaily(frequency Integer, period Quantity):
  case period.unit
    when 'h' then frequency * (24.0 / period.value)
    when 'min' then frequency * (24.0 / period.value) * 60
    when 's' then frequency * (24.0 / period.value) * 60 * 60
    when 'd' then frequency * (24.0 / period.value) / 24
    when 'wk' then frequency * (24.0 / period.value) / (24 * 7)
    when 'mo' then frequency * (24.0 / period.value) / (24 * 30) /* assuming 30 days in month */
    when 'a' then frequency * (24.0 / period.value) / (24 * 365) /* assuming 365 days in year */
    when 'hour' then frequency * (24.0 / period.value)
    when 'minute' then frequency * (24.0 / period.value) * 60
    when 'second' then frequency * (24.0 / period.value) * 60 * 60
    when 'day' then frequency * (24.0 / period.value) / 24
    when 'week' then frequency * (24.0 / period.value) / (24 * 7)
    when 'month' then frequency * (24.0 / period.value) / (24 * 30) /* assuming 30 days in month */
    when 'year' then frequency * (24.0 / period.value) / (24 * 365) /* assuming 365 days in year */
    when 'hours' then frequency * (24.0 / period.value)
    when 'minutes' then frequency * (24.0 / period.value) * 60
    when 'seconds' then frequency * (24.0 / period.value) * 60 * 60
    when 'days' then frequency * (24.0 / period.value) / 24
    when 'weeks' then frequency * (24.0 / period.value) / (24 * 7)
    when 'months' then frequency * (24.0 / period.value) / (24 * 30) /* assuming 30 days in month */
    when 'years' then frequency * (24.0 / period.value) / (24 * 365) /* assuming 365 days in year */
    else Message(null, true, 'OMTKLogic.ToDaily.UnknownUnit', ErrorLevel, 'Unknown unit ' & period.unit)
  end

/*
  Returns the conversion factor for the given ingredient
CDC Guidance:
https://www.cdc.gov/drugoverdose/pdf/calculating_total_daily_dose-a.pdf
https://www.cdc.gov/drugoverdose/modules/data-files.html
CMS Guidance:
https://www.cms.gov/Medicare/Prescription-Drug-Coverage/PrescriptionDrugCovContra/Downloads/Oral-MME-CFs-vFeb-2018.pdf
Opioid (strength in mg except where noted)	MME Conversion Factor*
Buprenorphine, transdermal patch (MCG/HR)	15.4 (2.2 X 7)
Buprenorphine, tablet or film	30
Buprenorphine, film (MCG)	0.03
Butorphanol	7
Codeine	0.15
Diphenoxylate 0.15
Dihydrocodeine	0.25
Alfentanil, Injection 400
Sufentanil, Injection 2
Remifentanil 100
Fentanyl, buccal/SL tabet or lozenge/troche (MCG)	0.13
Fentanyl, film or oral spray (MCG)	0.18
Fentanyl, nasal spray (MCG)	0.16
Fentanyl, transdermal patch (MCG/HR)	2.4
Fentanyl, Injection 1
Fentanyl, Lozenge Product 0.13
Hydrocodone	1
Hydromorphone	5
Levomethadyl acetate	8
Levorphanol tartrate	11
Meperidine 	0.1
Methadone	3
  1-20 mg/d 4
  21-40 mg/d 8
  41-60 mg/d 10
  61-80 mg/d 12
Morphine	1
Opium	1 // NOTE: Not present as an ingredient in the RxNorm data
Oxycodone	1.5
Oxymorphone	3
Pentazocine	0.37
Tapentadol	0.4
Tramadol	0.2
Benzhydrocodone 1.22
Oliceridine 5
*/
define function GetConversionFactor(ingredientCode Code, dailyDose Quantity, doseFormCode Code):
  case ToInteger(ingredientCode.code)
    when 161 then 0  /*	Acetaminophen */
    when 480 then ( /* Alfentanil */
      case
        when ToInteger(doseFormCode.code) = 1649574 then 400 /* injection */
        else Message(null, true, 'OMTKLogic.GetConversionFactor.UnknownDoseFor for Alfentanil', ErrorLevel, 'Unknown dose form code ' & doseFormCode.code)
      end
    )
    when 1191 then 0 /*	Aspirin */
    when 1223 then 0 /*	Atropine */
    when 1767 then 0 /*	Brompheniramine */
    when 1819 then ( /*	Buprenorphine */
      case
        //2.2 X 7 = 15.4
        when ToInteger(doseFormCode.code) = 316987 then 15.4 /* Transdermal system */
        else 30 /* Tablet or Film (or Film in MCG) */
      end
    )
    when 1841 then 7 /*	Butorphanol */
    when 1886 then 0 /*	Caffeine */
    when 2101 then 0 /*	Carisoprodol */
    when 2354 then 0 /*	chlorcyclizine */
    when 2400 then 0 /*	Chlorpheniramine */
    when 3500 then 0.15 /*	Diphenoxylate */
    when 2670 then 0.15 /*	Codeine */
    when 3423 then 5 /*	Hydromorphone */
    when 3498 then 0 /*	Diphenhydramine */
    when 56795 then ( /* Sufentanil */
      case
        when ToInteger(doseFormCode.code) = 1649574 then 2 /* injection */
        else Message(null, true, 'OMTKLogic.GetConversionFactor.UnknownDoseForm for Sufentanil', ErrorLevel, 'Unknown dose form code ' & doseFormCode.code)
      end
    )
    when 4337 then ( /*	Fentanyl */
      case
        when ToInteger(doseFormCode.code) in { 970789, 317007, 316992 } then 0.13 /* Buccal Tablet, Sublingual Tablet, Oral Lozenge */
        when ToInteger(doseFormCode.code) = 746839 then 0.18
        when ToInteger(doseFormCode.code) = 1649574 then 1 /* injection */
        when ToInteger(doseFormCode.code) = 1294702 then 0.13 /* lozenge Product */
        when ToInteger(doseFormCode.code) = 858080 then 0.18 /* Buccal Film */
        when ToInteger(doseFormCode.code) in { 126542, 346163, 1797831 } then 0.16 /* Nasal Spray,  Metered Dose Nasal Spray */
        when ToInteger(doseFormCode.code) = 346163 then 0.18 /* Mucosal Spray */
        when ToInteger(doseFormCode.code) = 316987 then 7.2 /* Transdermal system */ /* was previous 2.4 which I think it is a bug */
        else Message(null, true, 'OMTKLogic.GetConversionFactor.UnknownDoseForm', ErrorLevel, 'Unknown dose form code ' & doseFormCode.code)
      end
    )
    when 5032 then 0 /*	Guaifenesin */
    when 5489 then 1 /*	Hydrocodone */
    when 5640 then 0 /*	Ibuprofen */
    when 6102 then 0 /*	Kaolin */
    when 6378 then 11 /*	Levorphanol (NOTE: Given as Levorphanol tartrate in the CDC conversion table) */
    when 6754 then ( /*	Meperidine */
      case
        when ToInteger(doseFormCode.code) = 721656 then 0.3 /* IV form */
        else 0.1 /* Oral */
      end
    )
    when 6813 then ( /*	Methadone */
      case
        /*
         * note Ceiling will return the first integer greater than or equal to its argument
         * see conversion info here:
         * https://www.cdc.gov/drugoverdose/pdf/calculating_total_daily_dose-a.pdf
         */
        when Ceiling(dailyDose.value) between 1 and 20 then 4
        when Ceiling(dailyDose.value) between 21 and 40 then 8
        when Ceiling(dailyDose.value) between 41 and 60 then 10
        when Ceiling(dailyDose.value) >= 61 then 12
        else Message(null, dailyDose.value < 1, 'OMTKLogic.GetConversionFactor.DailyDoseLessThanOne', ErrorLevel, 'Daily dose less than 1')
      end
    )
    when 7052 then 1 /*	Morphine */
    when 7242 then 0 /*	Naloxone */
    when 7243 then 0 /*	Naltrexone */
    when 7804 then 1.5 /*	Oxycodone */
    when 7814 then 3 /*	Oxymorphone */
    when 8001 then 0.37 /*	Pentazocine */
    when 8163 then 0 /*	Phenylephrine */
    when 8175 then 0 /*	Phenylpropanolamine */
    when 8745 then 0 /*	Promethazine */
    when 8896 then 0 /*	Pseudoephedrine */
    when 9009 then 0 /*	Pyrilamine */
    when 10689 then 0.2 /*	Tramadol */
    when 10849 then 0 /*	Triprolidine */
    when 19759 then 0 /*	bromodiphenhydramine */
    when 19860 then 0 /*	butalbital */
    when 22696 then 0 /*	dexbrompheniramine */
    when 22697 then 0 /*	dexchlorpheniramine */
    when 23088 then 0.25 /*	dihydrocodeine */
    when 27084 then 0 /*	homatropine */
    when 35780 then 0 /*	ropivacaine */
    when 237005 then 8 /*	Levomethadyl (NOTE: given as Levomethadyl acetate in the CDC conversion table) */
    when 636827 then 0 /*	guaiacolsulfonate */
    when 787390 then 0.4 /*	tapentadol */
    when 73032 then (/*	remifentanil */
      case
        when ToInteger(doseFormCode.code) = 1649574 then 100 /* injection */
        else Message(null, true, 'OMTKLogic.GetConversionFactor.UnknownDoseForm for remifentanil', ErrorLevel, 'Unknown dose form code ' & doseFormCode.code)
      end
    )
    when 2001352 then 1.22 /* benzhydrocodone */
    when 2392230 then 5 /* oliceridine */
    else Message(null, true, 'OMTKLogic.GetConversionFactor.UnknownIngredientCode', ErrorLevel, 'Unknown ingredient code: ' & ingredientCode.code)
  end

define function EnsureMicrogramQuantity(strength Quantity):
  // TODO: This should be possible with just quantity arithmetic
  if strength.value <= 0.1 and (PositionOf('mg', strength.unit) = 0) then
    Quantity {
      value: strength.value * 1000,
      unit: 'ug' & Substring(strength.unit, 2)
    }
  else
    strength

/*
  Returns the opioid ingredients and their strengths that
  make up the drug identified by the given rxNormCode as a list of tuples:
  List<Tuple {
    rxNormCode Code,
    doseFormCode Code,
    doseFormName String,
    ingredientCode Code,
    ingredientName String,
    strength Quantity
  }>
*/

/*
GetIngredients:
  List<{
    rxNormCode Code,
    doseFormCode Code,
    ingredientCode code,
    strength Quantity
  }>
*/
define function GetIngredients(rxNormCode Code):
  OMTKData.DrugIngredients DI
    let unit: ToUCUM(DI.strengthUnit)
    where DI.drugCode = ToInteger(rxNormCode.code)
    return {
      rxNormCode: Code { code: ToString(DI.drugCode), system: 'http://www.nlm.nih.gov/research/umls/rxnorm', display: DI.drugName },
      doseFormCode: Code { code: ToString(DI.doseFormCode), system: 'http://www.nlm.nih.gov/research/umls/rxnorm', display: DI.doseFormName },
      ingredientCode: Code { code: ToString(DI.ingredientCode), system: 'http://www.nlm.nih.gov/research/umls/rxnorm', display: DI.ingredientName },
      unit: unit,
      strength: EnsureMicrogramQuantity(
          Quantity {
            value: DI.strengthValue,
            unit: unit
          }
        )
    }

/*
Returns the first RxNorm code in the given concept that matches a drug code
specified in OMTKData.
*/
define function GetMedicationCode(concept Concept):
  First(
    (concept.codes) C
      where C.system = 'http://www.nlm.nih.gov/research/umls/rxnorm'
        return singleton from (
          OMTKData.DrugIngredients DI
            where DI.drugCode = ToInteger(C.code)
            return Code {
              code: ToString(DI.drugCode),
              system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
              display: DI.drugName
            }
        )
  )

/*
Returns the display of the given concept, if present, otherwise, looks up medication
names for any RxNormCodes within the concept using the GetMedicationName function
*/
define function GetMedicationConceptName(concept Concept):
  if concept.display is null then
    First(
      (concept.codes) C
        where C.system = 'http://www.nlm.nih.gov/research/umls/rxnorm'
        return GetMedicationName(C)
    )
  else
    concept.display

/*
Returns the display of the given code, if present, otherwise looks it up from the OMTK data
*/
define function GetMedicationName(rxNormCode Code):
  if rxNormCode.display is null then
    singleton from (
      OMTKData.DrugIngredients DI
        where DI.drugCode = ToInteger(rxNormCode.code)
        return DI.drugName
    )
    else rxNormCode.display

/*
Returns the display of the given ingredient, if present, otherwise looks it up from the OMTK data
*/
define function GetIngredientName(ingredientCode Code):
  if ingredientCode.display is null then
    singleton from (
      OMTKData.DrugIngredients DI
        where DI.ingredientCode = ToInteger(ingredientCode.code)
        return DI.ingredientName
    )
    else ingredientCode.display

/*
Returns the display of the given dose form, if present, otherwise looks it up from the OMTK data
*/
define function GetDoseFormName(doseFormCode Code):
  if doseFormCode.display is null then
    singleton from (
      OMTKData.DrugIngredients DI
        where DI.doseFormCode = ToInteger(doseFormCode.code)
        return DI.doseFormName
    )
    else doseFormCode.display

/*
  Removes the last per argument from a unit
  NOTE: Rewrote to not use LastPositionOf, since that function is not implemented in the JS engine
  https://github.com/cqframework/cql-execution/issues/147
*/
define function StripPer(unit String):
  unit X
    let split: Split(unit, '/'),
      splitCount: Count(split)
    return
      if splitCount > 1 then
        Substring(unit, 0, Length(unit) - Length(split[splitCount - 1]) - 1)
      else
        unit
/*
define function StripPer(unit String):
  if LastPositionOf('/', unit) >= 0
    then Substring(unit, 0, LastPositionOf('/', unit))
    else unit
*/

/*
  Calculates daily dose for a specific ingredient based on the ingredient strength, dose form, dose quantity, and daily frequency
*/
define function GetDailyDose(ingredientCode Code, strength Quantity, doseFormCode Code, doseQuantity Quantity, dosesPerDay Decimal):
  case
    when dosesPerDay is null or doseQuantity is null or strength is null then
      null as Quantity
	  /* if patch --> daily dose = dose value (e.g, number patches with doseQuantity unit = "patch") * per-hour strength */
    when ToInteger(doseFormCode.code) = 316987 then
      /* buprenorphine or fentanyl patch */
      if ToInteger(ingredientCode.code) in { 1819, 4337 } then
       // Quantity { value: dosesPerDay * doseQuantity.value * strength.value, unit: strength.unit }
       /*
        * https://drive.google.com/drive/u/1/folders/1SQ7tufdYatX4qZeZtk6S5xWeNVC0zOQf
          The MME conversion factor for buprenorphine patches is based on the assumption that one milligram of parenteral buprenorphine is equivalent to 75 milligrams of oral morphine and that one patch delivers the dispensed micrograms per hour over a 24 hour day. Example: 5 ug/hr buprenorphine patch X 24 hrs = 120 ug/day buprenorphine = 0.12 mg/day = 9 mg/day oral MME. In other words, the conversion factor not accounting for days of use would be 9/5 or 1.8. However, since the buprenorphine patch remains in place for 7 days, we have multiplied the conversion factor by 7 (1.8 X 7 = 12.6). In this example, MME/day for four 5 μg/hr buprenorphine patches dispensed for use over 28 days would work out as follows: Example: 5 ug/hr buprenorphine patch X (4 patches/28 days) X 12.6 = 9 MME/day. Please note that because this allowance has been made based on the typical dosage of one buprenorphine patch per 7 days, you should first change all Days Supply in your prescription data to follow this standard, i.e., Days Supply for buprenorphine patches= # of patches x 7.
        */
       /*
        * The MME conversion factor for fentanyl patches is based on the assumption that one milligram of parenteral fentanyl is equivalent to 100 milligrams of oral morphine and that one patch delivers the dispensed micrograms per hour over a 24 hour day. Example: 25 ug/hr fentanyl patch X 24 hrs = 600 ug/day fentanyl = 60 mg/day oral morphine milligram equivalent. In other words, the conversion factor not accounting for days of use would be 60/25 or 2.4.
        However, since the fentanyl patch remains in place for 3 days, we have multiplied the conversion factor by 3 (2.4 X 3 = 7.2). In this
        example, MME/day for ten 25 μg/hr fentanyl patches dispensed for use over 30 days would work out as follows:
        Example: 25 ug/hr fentanyl patch X (10 patches/30 days) X 7.2 = 60 MME/day. Please note that because this allowance has been
        made based on the typical dosage of one fentanyl patch per 3 days, you should first change all Days Supply in your prescription
        data to follow this standard, i.e., Days Supply for fentanyl patches= # of patches X 3.
        */
        //1819 is buprenorphine, 4337 is fentanyl
        Quantity { value: dosesPerDay * strength.value, unit: strength.unit }

      else
        Message(null, true, 'OMTKLogic.GetDailyDoseDescription.UnknownPatchIngredient', ErrorLevel, 'Unknown patch ingredient: ' & ingredientCode.code & ':' & ingredientCode.display)

    /* if dose unit in actual mass units (mg or ug -- when it's a single med) --> daily dose = numTimesPerDay * dose */
    when doseQuantity.unit in { 'mg', 'ug'} then
      Quantity { value: dosesPerDay * doseQuantity.value, unit: doseQuantity.unit }

    /* if doseQuantity is in actual volume units (mL) --> daily dose = numTimesPerDay * dose * strength */
    when doseQuantity.unit = 'mL' and (PositionOf('/mL', strength.unit) = Length(strength.unit) - 3) then
      Quantity { value: dosesPerDay * doseQuantity.value * strength.value, unit: strength.unit } //display unit as it is

		/* if doseQuantity is not in actual units (e.g., 1 tab, 1 spray -- when it's a combo med with a unit of tablet, or it's mg/actuat) -->  daily dose = numTimesPerDay * dose value * strength value */
    else
      Quantity { value: dosesPerDay * doseQuantity.value * strength.value, unit: strength.unit } //display unit as it is
  end

/*
  Builds a description for the daily dose for an ingredient
*/
define function GetDailyDoseDescription(ingredientCode Code, strength Quantity, doseFormCode Code, doseQuantity Quantity, dosesPerDay Decimal, dailyDose Quantity, supplyQuantity Decimal, supplyDuration Decimal):
  case
    /* if patch */
    when ToInteger(doseFormCode.code) = 316987 then
      /* buprenorphine or fentanyl patch */
      if ToInteger(ingredientCode.code) in { 1819, 4337 } then
        GetIngredientName(ingredientCode) & ' patch: ' & ToString(supplyQuantity) & ' patches / ' & ToString(supplyDuration) & ' d * '& ToString(strength) & ' = ' + ToString(dailyDose)
      else
        Message(null, true, 'OMTKLogic.GetDailyDoseDescription.UnknownPatchIngredient', ErrorLevel, 'Unknown patch ingredient: ' & ingredientCode.code & ':' & ingredientCode.display)

    /* if dose unit in actual mass units (mg or ug -- when it's a single med) */
    when doseQuantity.unit in { 'mg', 'ug' } then
      GetIngredientName(ingredientCode) + ' ' + GetDoseFormName(doseFormCode) + ': ' + ToString(dosesPerDay) + '/d * ' + ToString(doseQuantity) + ' = ' + ToString(dailyDose)

    /* if doseQuantity in actual volume units (mL) or not in actual units (e.g. 1 tab, 1 spray) */
    else
      GetIngredientName(ingredientCode) + ' ' + GetDoseFormName(doseFormCode) + ': ' + ToString(dosesPerDay) + '/d * ' + ToString(doseQuantity) + ' * ' + ToString(strength) + ' = ' + ToString(dailyDose)
  end

/*
  Calculates MMEs for the given input prescription information and returns it
  as a list of tuples:
  List<Tuple {
    rxNormCode Code,
    doseFormCode Code,
    doseQuantity Quantity,
    dosesPerDay Decimal,
    ingredientCode Code,
    strength Quantity,
    dailyDose Quantity,
    dailyDoseDescription String,
    conversionFactor Decimal,
    mme Quantity
  }>
*/
define function CalculateMMEs(medications List<Tuple { rxNormCode Code, doseQuantity Quantity, dosesPerDay Decimal, supplyQuantity Decimal, supplyDuration Decimal}>):
  Flatten(
    medications M
      let Ingredients: GetIngredients(M.rxNormCode)
      return
        Ingredients I
          let
            adjustedDoseQuantity: EnsureMicrogramQuantity(M.doseQuantity),
            dailyDose: GetDailyDose(I.ingredientCode, I.strength, I.doseFormCode, adjustedDoseQuantity, M.dosesPerDay),
            dailyDoseDescription: GetDailyDoseDescription(I.ingredientCode, I.strength, I.doseFormCode, adjustedDoseQuantity, M.dosesPerDay, dailyDose, M.supplyQuantity, M.supplyDuration),
            factor: GetConversionFactor(I.ingredientCode, dailyDose, I.doseFormCode)
          return {
            rxNormCode: M.rxNormCode,
            doseFormCode: I.doseFormCode,
            doseQuantity: adjustedDoseQuantity,
            dosesPerDay: M.dosesPerDay,
            ingredientCode: I.ingredientCode,
            strength: I.strength,
            dailyDose: dailyDose,
            dailyDoseDescription: dailyDoseDescription & (' * factor: ' + Coalesce(ToString(factor), 'No conversion factor available')),
            conversionFactor: factor,
            mme: Quantity(
              dailyDose.value * factor,
              '{MME}/d'
            )
          }
  )

define function Quantity(value Decimal, unit String):
  case
    //only display unit if it is present
    when value is not null and unit is not null then
      Quantity { value: value, unit: unit }
    when value is not null then
      Quantity { value: value}
    else
      null
  end
