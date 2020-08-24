import drugIngridients from "./drugIngridients";
import {dateFormat} from '../helpers/formatit';

/*
This library provides functionality for calculating Milligram Morphine
Equivalents (MME) for opioid medications, as described in the CDC Opioid
Prescribing Guideline.
The functionality in this library was developed based on the Java-based
implementation described [here](http://build.fhir.org/ig/cqframework/opioid-cds-r4/service-documentation.html#solution-component-3-core-logic-processing-java-class),
as well as the MME conversion calculation published as part of the CDC Opioid
Prescribing Guideline.
The version of the OMTKLogic library to which this source code is based on uses the OMTKData library as the
source for drug ingredient and strength information, rather than the
OMTK data source. The library has no external dependencies.
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

function ToUCUM(unit) {
    switch(unit){
        case 'MG': return 'mg';
        case 'MG/ACTUAT': return 'mg/{actuat}';
        case 'MG/HR': return 'mg/h';
        case 'MG/ML': return 'mg/mL';
        default: return unit;
    }
}
/*
  Returns the conversion factor for the given ingredient
CDC Guidance:
https://www.cdc.gov/drugoverdose/pdf/calculating_total_daily_dose-a.pdf
https://www.cdc.gov/drugoverdose/modules/data-files.html
CMS Guidance:
https://www.cms.gov/Medicare/Prescription-Drug-Coverage/PrescriptionDrugCovContra/Downloads/Oral-MME-CFs-vFeb-2018.pdf
Opioid (strength in mg except where noted)	MME Conversion Factor*
Buprenorphine, transdermal patch (MCG/HR)	12.6
Buprenorphine, tablet or film	30
Buprenorphine, film (MCG)	0.03
Butorphanol	7
Codeine	0.15
Dihydrocodeine	0.25
Fentanyl, buccal/SL tabet or lozenge/troche (MCG)	0.13
Fentanyl, film or oral spray (MCG)	0.18
Fentanyl, nasal spray (MCG)	0.16
Fentanyl, transdermal patch (MCG/HR)	2.4
Hydrocodone	1
Hydromorphone	4
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
Tramadol	0.1
*/
function GetConversionFactor(ingredientCode, dailyDose, doseFormCode) {
    if (!ingredientCode) return 0;
    doseFormCode = doseFormCode || {};
    switch (parseInt(ingredientCode.code)) {
    case 161: return 0;  /*	Acetaminophen */
    case 1191: return 0; /*	Aspirin */
    case 1223: return 0; /*	Atropine */
    case 1767: return 0; /*	Brompheniramine */
    case 1819: /*	Buprenorphine */
        if (parseInt(doseFormCode.code) === 316987) return 12.6; /* Transdermal system */
        return 30; /* Tablet or Film (or Film in MCG) */
    case 1841: return 7; /*	Butorphanol */
    case 1886: return 0; /*	Caffeine */
    case 2101: return 0; /*	Carisoprodol */
    case 2354: return 0; /*	chlorcyclizine */
    case 2400: return 0; /*	Chlorpheniramine */
    case 2670: return 0.15; /*	Codeine */
    case 3423: return 4; /*	Hydromorphone */
    case 3498: return 0; /*	Diphenhydramine */
    case 4337: /*	Fentanyl */
        if ([970789, 317007, 316992].indexOf(parseInt(doseFormCode.code)) !== -1) return 0.13 /* Buccal Tablet, Sublingual Tablet, Oral Lozenge */
        else if (ToInteger(doseFormCode.code) === 858080) return 0.18; /* Buccal Film */
        else if ([126542, 346163, 1797831].indexOf(parseInt(doseFormCode.code)) !== -1) return 0.16; /* Nasal Spray, Mucosal Spray, Metered Dose Nasal Spray */
        else if (ToInteger(doseFormCode.code) === 316987) return 2.4; /* Transdermal system */
        break;
    case 5032: return 0; /*	Guaifenesin */
    case 5489: return 1; /*	Hydrocodone */
    case 5640: return 0; /*	Ibuprofen */
    case 6102: return 0; /*	Kaolin */
    case 6378: return 11; /*	Levorphanol (NOTE: Given as Levorphanol tartrate in the CDC conversion table) */
    case 6754: return 0.1; /*	Meperidine */
    case 6813: /*	Methadone */
        if (parseInt(dailyDose.value) >= 1 &&  parseInt(dailyDose.value) <= 20) return 4;
        if (parseInt(dailyDose.value) >= 21 &&  parseInt(dailyDose.value) <= 40) return 8;
        if (parseInt(dailyDose.value) >= 41 && parseInt(dailyDose.value) <= 60) return 10;
        if (dailyDose.value >= 61) return 12;
        break;
    case 7052: return 1 /*	Morphine */
    case 7242: return 0 /*	Naloxone */
    case 7243: return 0 /*	Naltrexone */
    case 7804: return 1.5 /*	Oxycodone */
    case 7814: return 3 /*	Oxymorphone */
    case 8001: return 0.37 /*	Pentazocine */
    case 8163: return 0 /*	Phenylephrine */
    case 8175: return 0 /*	Phenylpropanolamine */
    case 8745: return 0 /*	Promethazine */
    case 8896: return 0 /*	Pseudoephedrine */
    case 9009: return 0 /*	Pyrilamine */
    case 10689: return 0.1 /*	Tramadol */
    case 10849: return 0 /*	Triprolidine */
    case 19759: return 0 /*	bromodiphenhydramine */
    case 19860: return 0 /*	butalbital */
    case 22696: return 0 /*	dexbrompheniramine */
    case 22697: return 0 /*	dexchlorpheniramine */
    case 23088: return 0.25 /*	dihydrocodeine */
    case 27084: return 0 /*	homatropine */
    case 35780: return 0 /*	ropivacaine */
    case 237005: return 8 /*	Levomethadyl (NOTE: given as Levomethadyl acetate in the CDC conversion table) */
    case 636827: return 0 /*	guaiacolsulfonate */
    case 787390: return 0.4 /*	tapentadol */
    default: return 0;
    }
    return 0;
}

function EnsureMicrogramQuantity(strength){
    strength = strength || {};
    // TODO: This should be possible with just quantity arithmetic
    if (strength.value < 0.1 && strength.unit.indexOf("mg") === 0) 
        return {
          value: strength.value * 1000,
          unit: 'mcg' & strength.unit.substring(2)
        }
    return strength
}

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
function GetIngredients(rxNormCode) {
  rxNormCode = rxNormCode || {};
  let dSet = drugIngridients.filter(item => item.drugCode === parseInt(rxNormCode));
  if (!dSet.length) return false;
  let DI = dSet[0];
  return {
    rxNormCode: {code: DI.drugCode, system: 'http://www.nlm.nih.gov/research/umls/rxnorm', display: DI.drugName },
    doseFormCode: { code: DI.doseFormCode, system: 'http://www.nlm.nih.gov/research/umls/rxnorm', display: DI.doseFormName },
    ingredientCode: { code: DI.ingredientCode, system: 'http://www.nlm.nih.gov/research/umls/rxnorm', display: DI.ingredientName },
    strength: EnsureMicrogramQuantity({
          value: DI.strengthValue,
          unit: ToUCUM(DI.strengthUnit)
        })
  }
}

/*
Returns the display of the given ingredient, if present, otherwise looks it up from the OMTK data
*/
function GetIngredientName(ingredientCode){
  if (!ingredientCode) return false;
  if (ingredientCode.display) {
    return ingredientCode.display;
  }
  let dSet = drugIngridients.filter(item => {
    return item.ingredientCode.code === parseInt(ingredientCode.code);
  });
  if (dSet.length) {
    return dSet[0].ingredientCode.display;
  }
  return "";
}


/*
Returns the display of the given dose form, if present, otherwise looks it up from the OMTK data
*/
function GetDoseFormName(doseFormCode){
  if (!doseFormCode) return "";
  if (doseFormCode.display) return doseFormCode.display;
  let dSet = drugIngridients.filter(item => {
    return item.doseFormCode.code === parseInt(doseFormCode.code);
  });
  if (dSet.length) {
    return dSet[0].doseFormCode.display;
  }
  return "";
}


/*
  Removes the last per argument from a unit
*/
function StripPer(unit){
  if (!unit) return "";
  if (unit.indexOf("/") >= 0) {
    return unit.substring(0, unit.indexOf("/"));
  }
  return unit;
}

/*
  Calculates daily frequency given frequency within a period
*/
function ToDaily(frequency, period){
  frequency = frequency || 1;
  period = period || {};
  switch (period.unit) {
    case 'h' : return frequency * (24.0 / period.value);
    case 'min' : return frequency * (24.0 / period.value) * 60
    case 's' : return frequency * (24.0 / period.value) * 60 * 60
    case 'd' : return frequency * (24.0 / period.value) / 24
    case 'wk' : return frequency * (24.0 / period.value) / (24 * 7)
    case 'mo' : return frequency * (24.0 / period.value) / (24 * 30) /* assuming 30 days in month */
    case 'a' : return frequency * (24.0 / period.value) / (24 * 365) /* assuming 365 days in year */
    case 'hour' : return frequency * (24.0 / period.value)
    case 'minute' : return frequency * (24.0 / period.value) * 60
    case 'second' : return frequency * (24.0 / period.value) * 60 * 60
    case 'day' : return frequency * (24.0 / period.value) / 24
    case 'week' : return frequency * (24.0 / period.value) / (24 * 7)
    case 'month' : return frequency * (24.0 / period.value) / (24 * 30) /* assuming 30 days in month */
    case 'hours' : return frequency * (24.0 / period.value)
    case 'minutes' : return frequency * (24.0 / period.value) * 60
    case 'seconds' : return frequency * (24.0 / period.value) * 60 * 60
    case 'days' : return frequency * (24.0 / period.value) / 24
    case 'weeks' : return frequency * (24.0 / period.value) / (24 * 7)
    case 'months' : return frequency * (24.0 / period.value) / (24 * 30) /* assuming 30 days in month */
    case 'years' : return frequency * (24.0 / period.value) / (24 * 365) /* assuming 365 days in year */
    default: return 1;
  }
}

/*
  Calculates daily dose for a specific ingredient based on the ingredient strength, dose form, dose quantity, and daily frequency
*/
function GetDailyDose(ingredientCode, strength, doseFormCode, doseQuantity, dosesPerDay){
  doseFormCode = doseFormCode || {};
  dosesPerDay = dosesPerDay || 1;
  ingredientCode = ingredientCode || {};
  let strengthValue = strength && strength.value? strength.value: 1;
  let quantity = doseQuantity && doseQuantity.value ? doseQuantity.value: 1;
  let quantityUnit = doseQuantity && doseQuantity.unit? doseQuantity.unit: "";
  let strengthUnit = (strength ? strength.unit : "");

  /* if patch --> daily dose = dose value (e.g, number patches with doseQuantity unit = "patch") * per-hour strength */
  //console.log("Parameters to GetDailyDose: dose per day? ", dosesPerDay, " quantity ", quantity, " strength ", strengthValue)
  if (ToInteger(doseFormCode.code) === 316987) {
    /* buprenorphine or fentanyl patch */
    if ([1819, 4337].indexOf(ToInteger(ingredientCode.code)) !== -1) 
      return { value: dosesPerDay * quantity * strengthValue, unit: strengthUnit }
    return null;
  }
  /* if dose unit in actual mass units (mg or mcg -- when it's a single med) --> daily dose = numTimesPerDay * dose */
  if (['mg', 'mcg'].indexOf(quantityUnit) !== -1) {
    return { value: dosesPerDay * quantity, unit: quantityUnit };
  }

  /* if doseQuantity is in actual volume units (mL) --> daily dose = numTimesPerDay * dose * strength */
  if (String(quantityUnit) === 'mL' && (String(strengthUnit).indexOf('/mL') === String(strengthUnit).length - 3)) {
    return { value: dosesPerDay * quantity * strengthValue, unit: StripPer(strengthUnit) }
  }

  /* if doseQuantity is not in actual units (e.g., 1 tab, 1 spray -- when it's a combo med with a unit of tablet, or it's mg/actuat) -->  daily dose = numTimesPerDay * dose value * strength value */
  return { value: dosesPerDay * quantity * strengthValue, unit: StripPer(strengthUnit)}
}

function getDailyDoseDescription(dailyDose) {
  if (!dailyDose) return "";
  return ToInteger(dailyDose.value) + " " + dailyDose.unit;
}

function ToInteger(item) {
  return parseInt(item);
}

function ToPrescription(medication) {
  if (!medication) {
    return false;
  }
  let rxNormCode = GetMedicationCode(medication);
  let medicationName = medication.medicationCodeableConcept ? medication.medicationCodeableConcept.text: "";
  let quantity = medication.dispenseRequest && medication.dispenseRequest.quantity && medication.dispenseRequest.quantity.value ? medication.dispenseRequest.quantity.value: 1;
  let dosageInstruction = medication.dosageInstruction? medication.dosageInstruction[0]: {};
  let doseAndRate = dosageInstruction.doseAndRate && dosageInstruction.doseAndRate.length? dosageInstruction.doseAndRate[0]: {};
  let doseRange = doseAndRate.doseRange;
  let repeat = dosageInstruction.timing? dosageInstruction.timing.repeat: null;
  let frequencyMax = repeat && repeat.frequencyMax && repeat.frequencyMax? repeat.frequencyMax : 1;
  let repeatFrequency = repeat && repeat.frequency && repeat.frequency ? repeat.frequency : 1;
  let frequency = repeat ? Math.max(frequencyMax, repeatFrequency) : 1;
  let frequencyDescription = frequency + (frequencyMax ? ("-" + frequencyMax): "");
  let duration = medication.dispenseRequest ? medication.dispenseRequest.expectedSupplyDuration: null;
  let period = repeat && repeat.period ? { value: repeat.period, unit: repeat.periodUnit } : duration;
  let doseQuantity = {
    value: quantity,
    unit: duration? duration.unit: ""
  };
  if (doseAndRate && doseAndRate.doseQuantity) {
    doseQuantity = doseAndRate.doseQuantity.value;
  }
  if (doseRange && doseRange.high) {
    doseQuantity = doseRange.high.value;
  }
  let doseDescription = doseRange ? (doseRange.low + '-' + doseRange.high + doseRange.high.unit.value) : doseQuantity;
  let authoredOn = {...medication}.authoredOn ? {...medication}.authoredOn : {...medication}.dateWritten;
  return {
    name: medication.medicationCodeableConcept.text,
    rxNormCode: rxNormCode,
    doseQuantity: doseQuantity,
    isPRN: dosageInstruction.asNeeded,
    dosageInstruction: dosageInstruction,
    doseAndRate: doseAndRate,
    doseDescription: doseDescription,
    period: period,
    frequency: frequency,
    prescription: dosageInstruction.text? (medicationName + " " + dosageInstruction.text) : (medicationName + " " + doseDescription + " q" + frequencyDescription +  (dosageInstruction.asNeeded? " PRN": "")),
    dateWritten: dateFormat("", authoredOn, "YYYY-MM-DD"),
    authoredOn: medication.authoredOn ? medication.authoredOn: medication.dateWritten
  }
}

export function GetMedicationCode(medication) {
  if (!medication) return 0;
  let rxNormCode = 0;
  if (medication.medicationCodeableConcept && medication.medicationCodeableConcept.coding) {
    (medication.medicationCodeableConcept.coding).forEach(item => {
      if (rxNormCode) return true;
      if (/rxnorm/i.test(item.system)) {
        rxNormCode = item.code;
      }
    });
  }
  return rxNormCode;

}

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
export function CalculateMME(medication) {
  let M = ToPrescription(medication);
  //console.log("return med? ", M)
  let I =  GetIngredients(M.rxNormCode);
  //console.log("ingredient? ", I)
  if (!I) return false;
  let adjustedDoseQuantity = EnsureMicrogramQuantity(M.doseQuantity);
  //console.log("adjusted dose? ", adjustedDoseQuantity)
  let dosesPerDay = ToDaily(M.frequency, M.period);
  //console.log("doses per day ", dosesPerDay)
  let dailyDose = GetDailyDose(I.ingredientCode, I.strength, I.doseFormCode, adjustedDoseQuantity, dosesPerDay);
  //console.log("dailyDose ", dailyDose)
  let factor =  GetConversionFactor(I.ingredientCode, dailyDose, I.doseFormCode);
  return {
    name: (M.name ? M.name : GetIngredientName(I.ingredientCode)),
    rxNormCode: M.rxNormCode,
    doseFormName: GetDoseFormName(I.doseFormCode),
    doseFormCode: I.doseFormCode,
    doseQuantity: adjustedDoseQuantity,
    dosesPerDay: dosesPerDay,
    quantity: adjustedDoseQuantity.value,
    ingredientCode: I.ingredientCode,
    strength: I.strength,
    dailyDose: dailyDose,
    dailyDoseDescription: getDailyDoseDescription(dailyDose),
    conversionFactor: factor,
    MMEValue: ToInteger(dailyDose.value * factor),
    MMEUnit: '{MME}/d',
    prescription: M.prescription,
    dateWritten: M.dateWritten,
    authoredOn: M.authoredOn
  }
}

