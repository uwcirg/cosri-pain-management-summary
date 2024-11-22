import {isDateInPast, getDiffMonths} from "./utility";
const functions = { ifAnd, ifOr, ifNone, ifOneOrMore, ifGreaterThanOrEqualTo, ifContains, ifEqualTo, if3MonthsDue, if4MonthsDue, ifOverdue, ifMostRecent, ifAdult};

// returns false if the given entry should not be flagged
// returns the flag text for an entry that should be flagged
export default function flagit(entry, subSection, summary) {
  const flags = subSection && subSection.tables ? subSection?.tables[0]?.flags : subSection.flags;
  if (flags == null) return false;

  const flagResults = flags.reduce((accumulator, flag) => {
    const flagRule = flag.flag;
    const flagClass = (flag.flagClass?(flag.flagClass): "");
    const flagDate = (flag.flagDateField?(flag.flagDateField): "");
    let elementText = "";
    if (entry && flag.key && entry[flag.key]) {
      elementText = entry[flag.key];
    }
    let displayText = flag.flagText.replace('{name}', `- ${elementText}`);
    if (displayText && flag.flagTextMapping) {
      //specific mapping specified for each flag text
      //convert text when matching pattern found
      for (const item of flag.flagTextMapping) {
        let regex = RegExp(item.pattern, 'gi');
        if (regex.test(displayText)) {
          displayText = item.name;
          break;
        }
      }
    }
    if (flagRule === 'always') {
      if (entry != null) {
        accumulator.push(displayText);
      }
    } else if (flagRule === 'ifNone' && (entry == null || (Array.isArray(entry) && entry.length===0))) {
      accumulator.push(displayText);
    } else if (typeof flagRule === 'string') {
      if (functions[flagRule](entry, entry, subSection, summary)) {
        accumulator.push(displayText);
      }
    } else if (typeof flagRule === 'object') {
      const rule = Object.keys(flagRule)[0];
      if (functions[rule](flagRule[rule], entry, subSection, summary)) {
        if (displayText) {
          accumulator.push({
            "text" : displayText,
            "class": flagClass,
            "date" : flagDate
          });
        }
      }
    }

    return accumulator;
  }, []);

  return flagResults.length === 0 ? false : flagResults[0];
}

function ifAnd(flagRulesArray, entry, subSection, summary) {
  for (let i = 0; i < flagRulesArray.length; ++i) {
    const flagRule = flagRulesArray[i];
    let match;
    if (typeof flagRule === 'string') {
      match = functions[flagRule](entry, entry, subSection, summary);
    } else {
      const rule = Object.keys(flagRule)[0];
      match = functions[rule](flagRule[rule], entry, subSection, summary);
    }

    if (match === false) return false;
  }

  return true;
}

function ifOr(flagRulesArray, entry, subSection, summary) {
  for (let i = 0; i < flagRulesArray.length; ++i) {
    const flagRule = flagRulesArray[i];
    let match;

    if (typeof flagRule === 'string') {
      match = functions[flagRule](entry, entry, subSection, summary);
    } else {
      const rule = Object.keys(flagRule)[0];
      match = functions[rule](flagRule[rule], entry, subSection, summary);
    }

    if (match) return true;
  }

  return false;
}

function ifNone(value, entry, subSection, summary) {
  return value == null || (Array.isArray(value) && value.length === 0);
}

function ifOneOrMore(value, entry, subSection, summary) {
  if (value != null && value.table != null && value.source != null) {
    const entries = summary[value.source] ? summary[value.source][value.table] : null;
    if (entries == null) {
      return false;
    } else if (Array.isArray(entries)) {
      return entries.length > 0;
    } else {
      return Object.keys(entries).length > 0;
    }
  }

  return value != null;
}

function ifGreaterThanOrEqualTo(value, entry, subSection, summary) {
  let targetEntry = entry;
  if (value.table != null && value.source != null) {
    targetEntry = summary[value.source] ? summary[value.source][value.table] : null;
  }
  if (targetEntry == null) return false;
  if (Array.isArray(targetEntry) && targetEntry.length) {
    targetEntry = targetEntry[0]
  }
  const valueToCompare = value.targetValue != null ? value.targetValue : value.value;
  return parseInt(targetEntry[value.header], 10) >= valueToCompare;
}
/*
 * return true if an entry's value for a field matches the specified target value
 */
function ifEqualTo(value, entry, subSection, summary) {
  if (!entry) return false;
  if (Array.isArray(entry[value.header])) return entry[value.header].indexOf(value.targetValue) !== -1;
  if (value.type === "boolean") {
    return Boolean(entry[value.header]) === Boolean(value.targetValue);
  }
  return entry[value.header] === value.targetValue;
}
/*
 * return true if a value within a specified field for an entry is found within the dataset
 */
function ifContains(value, entry, subSection, summary) {
  if (!(value.table && value.source))  {
    return ifEqualTo(value, entry, subSection, summary);
  }
  let entries = summary[value.source] ? summary[value.source][value.table] : null;
  if (!entries) return false;
  if (!value.targetValue) return false;
  return entries.filter(item => {
    if (Array.isArray(item[value.header])) return item[value.header].indexOf(value.targetValue) !== -1;
    return item[value.header] === value.targetValue;
  }).length > 0;
}

function ifMostRecent(value, entry, subSection, summary) {
  const section = summary[subSection.dataKeySource]? summary[subSection.dataKeySource][subSection.dataKey] : null;
  if (!section || !section.length) return false;
  if (!entry) return false;
  const targetDate = entry[value.targetField];
  if (!targetDate) return false;
  let cloneSet = JSON.parse(JSON.stringify(section));
  //sort data in descending order
  cloneSet.sort(function(a, b) { return new Date(b[value.targetField]) - new Date(a[value.targetField]) });
  return cloneSet.filter((item, index) => {
    return item[value.targetField] === targetDate && index === 0;
  }).length > 0;
}

function if3MonthsDue(value, entry, subSection, summary) {
  const section = summary[subSection.dataKeySource]? summary[subSection.dataKeySource][subSection.dataKey] : null;
  if (!section || !section.length) return false;
  if (!entry) return false;
  const targetDate = entry[value.targetField];
  if (!targetDate) return false;
  const diff = getDiffMonths(new Date(), new Date(targetDate));
  //console.log("if3MonthsDue months diff ", diff);
  return diff >= 0 && diff <= 3;
}

function if4MonthsDue(value, entry, subSection, summary) {
  const section = summary[subSection.dataKeySource]? summary[subSection.dataKeySource][subSection.dataKey] : null;
  if (!section || !section.length) return false;
  if (!entry) return false;
  const targetDate = entry[value.targetField];
  if (!targetDate) return false;
  const diff = getDiffMonths(new Date(), new Date(targetDate));
  //console.log("if4MonthsDue months diff ", diff);
  return diff > 3 && diff <= 4;
}

function ifOverdue(value, entry, subSection, summary) {
  const section = summary[subSection.dataKeySource]? summary[subSection.dataKeySource][subSection.dataKey] : null;
  if (!section || !section.length) return false;
  if (!entry) return false;
  const targetDate = entry[value.targetField];
  if (!targetDate) return false;
  return isDateInPast(new Date(targetDate), new Date());
}

function ifAdult(value, entry, subSection, summary) {
  if (!summary || !summary["Patient"]) return false;
  //age calculated in CQL
  return parseInt(summary["Patient"]["Age"]) >= 18;
}
