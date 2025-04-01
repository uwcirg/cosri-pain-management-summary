import moment from "moment";
import { toBlob, toJpeg } from "html-to-image";
import { getEnv, ENV_VAR_PREFIX } from "../utils/envConfig";
import reportSummarySections from "../config/report_config";
import { shortDateRE, dateREZ} from "./formatit";
import { getTokenInfoFromStorage } from "./timeout";

/*
 * return number of days between two dates
 * @params dateString1 date #1 to be compared
 *         dateString2 date #2 to be compared
 */
export function getDiffDays(dateString1, dateString2) {
  if (!dateString1 || !dateString2) return 0;
  //set two date variables
  let date1 = new Date(dateString1),
    date2 = new Date(dateString2);
  // To calculate the time difference of two dates
  var diffInTime = date2.getTime() - date1.getTime();
  // To calculate the no. of days between two dates
  return Math.ceil(diffInTime / (1000 * 3600 * 24));
}

/*
 * return Date object for a given input date string
 * @params input date string to be converted
 */
export function getDateObjectInLocalDateTime(input) {
  if (!input) return null;
  if (shortDateRE.test(input)) {
    // If input is just a date (YYYY-MM-DD), appending "T00:00:00" to allow correct conversion to local date/time
    return new Date(input + "T00:00:00");
  }
  if (dateREZ.test(input)) {
    // If input is already a full ISO 8601 timestamp, pass it as-is
    // a date string with a Z designator will result in a local date/time when passed to Date object
    return new Date(input);
  }
  return new Date(input);
}

/*
 * return number of months difference
 * @params startDate, endDate of type Date
 */
export function getDiffMonths(startDate, endDate) {
  let dtEndDate = endDate ? endDate : new Date();
  let dtStartDate = startDate ? startDate : new Date();
  return moment(dtEndDate).diff(dtStartDate, "months", true);
}

/*
 * return whether the firstDate is in the past compared to the secondDate
 * @params firstDate, secondDate of type Date object
 */
export function isDateInPast(firstDate, secondDate) {
  if (firstDate.setHours(0, 0, 0, 0) <= secondDate.setHours(0, 0, 0, 0)) {
    return true;
  }
  return false;
}
/*
 * check if an image has completed loading
 */
export function imageOK(img) {
  if (!img) {
    return false;
  }
  if (!img.getAttribute("src")) {
    return false;
  }
  if (!img.complete) {
    return false;
  }
  if (typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0) {
    return false;
  }
  return true;
}

/*
 * check whether element is within browser viewport
 */
export function isInViewport(elem) {
  if (!elem) return false;
  var bounding = elem.getBoundingClientRect();
  return (
    bounding.top >= 0 &&
    bounding.left >= 0 &&
    bounding.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    bounding.right <=
      (window.innerWidth || document.documentElement.clientWidth)
  );
}

/*
 * @param array of numbers
 * @return the sum of numbers in the array
 */
export function sumArray(array) {
  if (!array || !Array.isArray(array) || !array.length) return 0;
  return array.reduce((a, b) => (isNaN(a) ? 0 : a) + (isNaN(b) ? 0 : b));
}

/*
 * @param dateInput, a date string or object
 * @param todayInput, optional today's date string or object
 * @return return number of days difference of date input from today
 */
export function daysFromToday(dateInput, todayInput) {
  let today = new Date();
  if (todayInput)
    today = todayInput instanceof Date ? todayInput : new Date(todayInput);
  let originalDate =
    dateInput instanceof Date ? dateInput : new Date(dateInput);
  let dObj = new Date(originalDate.valueOf()); //get copy of date so as not to mutate the original date
  let oneDay = 1000 * 60 * 60 * 24;
  let diff = (today.setHours(0, 0, 0, 0) - dObj.setHours(0, 0, 0, 0)) / oneDay;
  //console.log("date " , dateInput, " dif ", diff)
  if (isNaN(diff)) return 0;
  return diff;
}

export function range(start, end) {
  return new Array(end - start + 1).fill(undefined).map((_, i) => i + start);
}

export function isNumber(target) {
  if (target == null || String(target).trim() === "") return false;
  if (typeof target === "number") return true;
  return !isNaN(target);
}

export function isEnvEpicQueries() {
  const envVar = getEnv(`${ENV_VAR_PREFIX}_EPIC_SUPPORTED_QUERIES`);
  return envVar && String(envVar).toLowerCase() === "true";
}

export function getEnvInstrumentList() {
  return getEnv(`${ENV_VAR_PREFIX}_INSTRUMENT_IDS`);
}

export function getReportInstrumentList() {
  const envInstrumentList = getEnvInstrumentList();
  if (envInstrumentList)
    return envInstrumentList
      .split(",")
      .map((item) => item.trim())
      .map((o) => ({
        id: o,
        key: o.replace("CIRG-", ""),
      }));
  const qList = reportSummarySections
    .filter((section) => section.questionnaires)
    .map((section) => section.questionnaires);
  if (!qList.length) return null;
  return [...new Set(qList.flat())];
}

export function getReportInstrumentIdByKey(key) {
  const qList = getReportInstrumentList();
  if (isEmptyArray(qList)) return "";
  const matchedInstrument = qList.find((o) => o.key === key);
  return matchedInstrument ? matchedInstrument.id : "";
}

export function getDisplayDateFromISOString(isocDateString, format) {
  if (!isocDateString) return "--";
  const objDate = new Date(isocDateString);
  if (isNaN(objDate)) return "--";
  const displayDate = objDate
    ? objDate.toLocaleString(
        "en-us",
        format
          ? format
          : {
              year: "numeric",
              month: "short",
              day: "2-digit",
            }
      )
    : "--";
  return displayDate;
}

export function renderImageFromSVG(imageElement, svgElement) {
  if (!svgElement || !imageElement) return;
  const svgData = new XMLSerializer().serializeToString(svgElement);
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  let img = imageElement.cloneNode(true);
  img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
  img.onload = function () {
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(img, 0, 0, imageElement.width, imageElement.height);
  };
  imageElement.replaceWith(img);
}

export function downloadDomImage(event, element, downloadFileName, options) {
  if (event) {
    event.stopPropagation();
  }
  const params = options ? options : {};
  if (params.beforeDownload) {
    params.beforeDownload();
  }
  toBlob(element, params)
    .then((blob) => {
      if (window.saveAs) {
        window.saveAs(blob, downloadFileName);
      } else {
        const FileSaver = require("file-saver");
        FileSaver.saveAs(blob, downloadFileName);
      }
      if (params.afterDownload) {
        params.afterDownload();
      }
    })
    .catch((e) => {
      console.log("Error occurred downloading image ", e);
      if (params.afterDownload) {
        params.afterDownload(e);
      }
    });
}

export function downloadSVGImage(
  event,
  svgElement,
  placeholderImageElementId,
  downloadFileName
) {
  if (event) event.stopPropagation();
  if (!svgElement) return;
  const width =
    typeof svgElement.clientWidth !== "undefined" ? svgElement.clientWidth : 0;
  const height =
    typeof svgElement.clientHeight !== "undefined"
      ? svgElement.clientHeight
      : 0;
  const setDimensions = () => {
    if (typeof svgElement.setAttribute !== "function") return;
    svgElement.setAttribute("width", width);
    svgElement.setAttribute("height", height);
    return true;
  };

  setDimensions();

  const svgData = new XMLSerializer().serializeToString(svgElement);
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");

  let img = document.querySelector("#" + placeholderImageElementId);
  if (!img) {
    img = document.createElement("img");
    img.classList.add("print-image");
    img.style.zIndex = -1;
    img.style.position = "absolute";
    img.style.opacity = 0;
    img.setAttribute("id", placeholderImageElementId);
    document.body.appendChild(img);
  }

  img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
  img.onload = function () {
    const width =
      typeof svgElement.getAttribute !== "undefined"
        ? svgElement.getAttribute("width")
        : img.width; // half the width of the original svg
    const height =
      typeof svgElement.getAttribute !== "undefined"
        ? svgElement.getAttribute("height")
        : img.height; // half the height of the original svg
    setTimeout(() => {
      const canvasWidth = width ? width : img.width;
      const canvasHeight = height ? height : img.height;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      canvas.toBlob((blob) => {
        const URL = window.URL || window.webkitURL || window;
        const imageURL = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = imageURL;
        link.download = downloadFileName ? downloadFileName : "image";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          document.body.removeChild(img);
          if (typeof svgElement.setAttribute === "function") {
            svgElement.setAttribute("width", "100%");
            svgElement.setAttribute("height", "100%");
          }
        }, 0);
      }, "image/png");
      // Now is done
      // console.log(canvas.toDataURL("image/png"));
    }, 500);
  };
}

export function copySVGImage(
  event,
  svgElement,
  placeholderImageElementId,
  mimeType,
  options
) {
  event.preventDefault();
  if (!svgElement) return;
  const width =
    typeof svgElement.clientWidth !== "undefined" ? svgElement.clientWidth : 0;
  const height =
    typeof svgElement.clientHeight !== "undefined"
      ? svgElement.clientHeight
      : 0;
  const setDimensions = () => {
    if (typeof svgElement.setAttribute !== "function") return;
    if (width) svgElement.setAttribute("width", width);
    if (height) svgElement.setAttribute("height", height);
    return true;
  };

  setDimensions();
  const svgData = new XMLSerializer().serializeToString(svgElement);
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");

  let img = document.querySelector("#" + placeholderImageElementId);
  if (!img) {
    img = document.createElement("img");
    img.classList.add("print-image");
    img.style.zIndex = -1;
    img.style.position = "absolute";
    img.style.opacity = 0;
    document.body.appendChild(img);
  }
  img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
  const imageType = mimeType ? mimeType : "image/png";
  let items = {
    [imageType]: new Promise(async (resolve) => {
      await fetch(img.src).then((response) => response.blob());
      const canvasWidth = width ? width : img.width;
      const canvasHeight = height ? height : img.height;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      canvas.toBlob((blob) => {
        if (width && typeof svgElement.setAttribute) {
          svgElement.setAttribute("width", "100%");
        }
        if (height && typeof svgElement.setAttribute) {
          svgElement.setAttribute("height", "100%");
        }
        setTimeout(() => {
          document.body.removeChild(img);
        }, 0);
        resolve(blob);
      });
    }),
  };
  if (options && options.clipboardItems) {
    options.clipboardItems.forEach((item) => {
      // let itemToAdd = {
      //   [item.imageType]: getHTMLImageClipboardItem(item.element, item.options)
      // };
      const itemToAdd = getHTMLImageClipboardItem(item.element, item.options);
      items = { ...items, ...itemToAdd };
    });
  }

  const clipboardItem = new window.ClipboardItem(items);
  // const itemsToCopy = [
  //   clipboardItem,
  //   ...(options && options.clipboardItems ? options.clipboardItems : []),
  // ];
  writeBlobToClipboard(clipboardItem)
    .then((x) => {
      alert("Image copied to clipboard ", x);
    })
    .catch((e) => {
      alert("Error! Unable to copy image to clipboard!");
      console.log(e);
    });
  return;
}
export function getHTMLImageClipboardItem(domElement, options) {
  const imageType =
    options && options.imageType ? options.imageType : "image/png";
  return {
    [imageType]: new Promise(async (resolve) => {
      if (imageType === "image/png") {
        const imageBlob = await toBlob(domElement, options);
        resolve(imageBlob);
      } else if (imageType === "image/jpeg") {
        const imageBlob = await toJpeg(domElement, options);
        resolve(imageBlob);
      } else {
        const imageBlob = await toBlob(domElement, options);
        resolve(imageBlob);
      }
    }),
  };
}
export function copyDomToClipboard(domElement, options) {
  if (!allowCopyClipboardItem()) return null;
  const params = options ? options : {};
  if (params.beforeCopy) {
    params.beforeCopy();
  }

  writeBlobToClipboard(
    new window.ClipboardItem(getHTMLImageClipboardItem(domElement, params))
  )
    .then((x) => {
      //alert("Content copied to clipboard ", x);
      if (params.afterCopy) {
        params.afterCopy();
      }
    })
    .catch((e) => {
      //alert("Error! Unable to copy content to clipboard! " + e);
      console.log(e);
      console.log("passed param ", params);
      if (params.afterCopy) {
        params.afterCopy(e);
      }
    });
}
export function allowCopyClipboardItem() {
  if (typeof window.ClipboardItem === "undefined") return false;
  if (!navigator?.clipboard?.write) return false;
  return true;
}
export async function writeHTMLToClipboard(htmlContent) {
  if (!allowCopyClipboardItem())
    return Promise.reject("ClipboardItem API is not supported");
  const clipboardItem = new window.ClipboardItem({
    "text/html": new Blob([htmlContent], { type: "text/html" }),
  });
  return writeBlobToClipboard(clipboardItem);
}

export async function writeTextToClipboard(text) {
  return await navigator.clipboard.writeText(text);
}
export async function writeBlobToClipboard(clipboardItem) {
  if (!allowCopyClipboardItem())
    return Promise.reject("ClipboardItem API is not supported");
  return navigator.clipboard.write([clipboardItem]);
}

export function getDifferenceInYears(fromDate, toDate) {
  if (!fromDate || !(fromDate instanceof Date)) return 0;
  if (!toDate || !(toDate instanceof Date)) return 0;
  if (isNaN(fromDate)) return 0;
  if (isNaN(toDate)) return 0;
  let diff = (toDate.getTime() - fromDate.getTime()) / 1000;
  diff /= 60 * 60 * 24;
  const diffYears = Math.abs(diff / 365.25);
  // console.log("difference in years ", diffYears);
  return diffYears;
}

export function getQuestionnaireDescription(fhirQuestionnaire) {
  if (!fhirQuestionnaire) return "";
  if (!fhirQuestionnaire.description) {
    if (fhirQuestionnaire.item && Array.isArray(fhirQuestionnaire.item)) {
      const introElement = fhirQuestionnaire.item.find(
        (child) => child.linkId && child.linkId.value === "introduction"
      );
      if (introElement) {
        if (
          introElement.text &&
          introElement.text.extension &&
          introElement.text.extension[0]
        ) {
          return introElement.text.extension[0].value.value;
        }
      }
    }
    return "";
  }
  const commonmark = require("commonmark");
  const reader = new commonmark.Parser({ smart: true });
  const writer = new commonmark.HtmlRenderer({
    linebreak: "<br />",
    softbreak: "<br />",
  });
  const parsedObj = reader.parse(fhirQuestionnaire.description.value);
  const description =
    fhirQuestionnaire.description && fhirQuestionnaire.description.value
      ? writer.render(parsedObj)
      : "";
  return description;
}

export function getQuestionnaireTitle(fhirQuestionnaire) {
  if (!fhirQuestionnaire) return "";
  if (fhirQuestionnaire.title && fhirQuestionnaire.title.value)
    return fhirQuestionnaire.title.value;
  return "";
}

export function toDate(stringDate) {
  if (stringDate instanceof Date) return stringDate;
  return new Date(stringDate);
}

export function getEPICPatientIdFromSource(fhirPatientSource) {
  if (!fhirPatientSource || isEmptyArray(fhirPatientSource.identifier))
    return "";
  if (isReportEnabled()) {
    return fhirPatientSource.identifier.find(
      (o) => o.system === "http://www.uwmedicine.org/epic_patient_id"
    )?.value;
  }

  //add other check for different system if needed

  return "";
}

export function getPatientNameFromSource(fhirPatientSource) {
  if (
    !fhirPatientSource ||
    !fhirPatientSource.name ||
    !Array.isArray(fhirPatientSource.name) ||
    !fhirPatientSource.name.length
  )
    return "";
  const officialName = fhirPatientSource.name.find(
    (item) => item.use === "official"
  );
  const useName = officialName ? officialName : fhirPatientSource.name[0];
  const firstName =
    useName.given && useName.given.length ? useName.given[0] : "";
  const lastName = useName.family ?? "";
  return [firstName, lastName].join(" ");
}

let buttonTransitionId = 0;
export function addButtonSuccessStateTransition(buttonRef, transitionDuration) {
  if (!buttonRef) return;
  buttonRef.classList.add("button--loaded");
  clearTimeout(buttonTransitionId);
  buttonTransitionId = setTimeout(
    () => buttonRef.classList.remove("button--loaded"),
    transitionDuration || 1000
  );
}

export function addButtonErrorStateTransition(buttonRef, transitionDuration) {
  if (!buttonRef) return;
  buttonRef.classList.add("button--loaded");
  buttonRef.classList.add("error");
  clearTimeout(buttonTransitionId);
  buttonTransitionId = setTimeout(() => {
    buttonRef.classList.remove("button--loaded");
    buttonRef.classList.remove("error");
  }, transitionDuration || 1000);
}

export function getEnvSystemType() {
  return getEnv(`${ENV_VAR_PREFIX}_SYSTEM_TYPE`);
}

export function isNotProduction() {
  let systemType = getEnvSystemType();
  return systemType && String(systemType).toLowerCase() !== "production";
}

export function isProduction() {
  return String(getEnvSystemType()).toLowerCase() !== "development";
}

export function getEnvConfidentialAPIURL() {
  return getEnv(`${ENV_VAR_PREFIX}_CONF_API_URL`);
}
// write to audit log
export function writeToLog(message, level, params) {
  if (!getEnvConfidentialAPIURL()) return;
  if (!message) return;
  const logLevel = level ? level : "info";
  // use Object.assign to prevent modification of original params 
  const logParams = Object.assign({}, params ? params : {});
  if (!logParams.tags) logParams.tags = [];
  const COSRI_FRONTEND_TAG = "cosri-frontend";
  if (logParams.tags.indexOf(COSRI_FRONTEND_TAG) === -1) {
    logParams.tags.push(COSRI_FRONTEND_TAG);
  }
  if (Object.keys(logParams).indexOf("user") === -1) {
    const userId = getUserIdFromAccessToken();
    if (userId) {
      logParams.user = {
        username: userId
      };
    }
  }
  const auditURL = `${getEnvConfidentialAPIURL()}/auditlog`;
  const patientName = params.patientName ? params.patientName : "";
  let messageString = "";
  if (typeof message === "object") {
    messageString = message.toString();
  } else messageString = message;
  if (!messageString) return;
  fetch(auditURL, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...{ patient: patientName, message: messageString, level: logLevel },
      ...logParams,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    })
    .then(function (data) {
      console.log("audit request succeeded with response ", data);
    })
    .catch(function (error) {
      console.log("Request failed", error);
    });
}

export function saveData(queryParams) {
  if (!getEnvConfidentialAPIURL()) return;
  const saveDataURL = `${getEnvConfidentialAPIURL()}/save_data`;
  const params = queryParams || {};
  if (!params.data) return;
  fetch(saveDataURL, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
    .then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    })
    .then(function (data) {
      console.log("save data request succeeded with response ", data);
    })
    .catch(function (error) {
      console.log("Request failed to save data: ", error);
    });
}

export function getErrorMessageString(error, defaultMessage) {
  return error
    ? typeof error === "object"
      ? error.toString()
      : typeof error === "string"
      ? error.replace(/<\/?[^>]+(>|$)/g, "")
      : defaultMessage ?? `Error occurred retrieving data`
    : "";
}

export function isEmptyArray(object) {
  if (object == null || !object) return true;
  if (!Array.isArray(object)) return true;
  return !object.length;
}

export function removeDuplicatesFromArrayByProperty(arr, prop) {
  if (isEmptyArray(arr) || !prop) return arr;
  return arr.reduce((accumulator, current) => {
    const existing = accumulator.find((item) => item[prop] === current[prop]);
    if (!existing) {
      accumulator.push(current);
    }
    return accumulator;
  }, []);
}

export function isElementOverflown(element, dimension) {
  if (!element) return false;
  const isWidthOverflown = element.scrollWidth > element.clientWidth;
  var isHeightOverflown = element.scrollHeight > element.clientHeight;
  if (!dimension) return isWidthOverflown || isHeightOverflown;
  if (dimension === "width") return isWidthOverflown;
  if (dimension === "height") return isHeightOverflown;
  return isWidthOverflown || isHeightOverflown;
}

export function getSiteId() {
  return getEnv(`${ENV_VAR_PREFIX}_SITE_ID`);
}

export function isReportEnabled() {
  const siteId = getSiteId();
  return ["uwmc", "demo"].indexOf(String(siteId).toLowerCase()) !== -1;
}

export function getEnvDashboardURL() {
  return getEnv(`${ENV_VAR_PREFIX}_DASHBOARD_URL`);
}

export function getPatientSearchURL(shouldClearSession) {
  const PATIENT_SEARCH_ROOT_URL = getEnvDashboardURL();
  if (!PATIENT_SEARCH_ROOT_URL) return "/";
  const PATIENT_SEARCH_URL =
    PATIENT_SEARCH_ROOT_URL + (shouldClearSession ? "/clear_session" : "");
  return PATIENT_SEARCH_URL;
}

export function getEnvVersionString() {
  return getEnv(`${ENV_VAR_PREFIX}_VERSION_STRING`);
}

export function dedupArrObjects(arr, key) {
  if (isEmptyArray(arr)) return null;
  if (!key) return arr;
  return arr.reduce((acc, obj) => {
    if (!acc.find(item => item[key] === obj[key])) {
      acc.push(obj);
    }
    return acc;
  }, []);
}

export function getMatomoTrackingSiteId() {
  return getEnv(`${ENV_VAR_PREFIX}_MATOMO_SITE_ID`);
}

export function getUserIdFromAccessToken() {
  const accessToken = getTokenInfoFromStorage();
  if (!accessToken) return null;
  if (accessToken.profile) return accessToken.profile;
  if (accessToken.fhirUser) return accessToken.fhirUser;
  return accessToken["preferred_username"];
}

export function addMatomoTracking() {
  // already generated script, return
  if (document.querySelector("#matomoScript")) return;
  const userId = getUserIdFromAccessToken();
  // no user Id return
  if (!userId) return;
  const siteId = getMatomoTrackingSiteId();
  // no site Id return
  if (!siteId) return;
  // init global piwik tracking object
  window._paq = [];
  window._paq.push(["trackPageView"]);
  window._paq.push(["enableLinkTracking"]);
  window._paq.push(["setSiteId", siteId]);
  window._paq.push(["setUserId", userId]);

  let u = "https://piwik.cirg.washington.edu/";
  window._paq.push(["setTrackerUrl", u + "matomo.php"]);
  let d = document,
    g = d.createElement("script"),
    headElement = document.querySelector("head");
  g.type = "text/javascript";
  g.async = true;
  g.defer = true;
  g.setAttribute("src", u + "matomo.js");
  g.setAttribute("id", "matomoScript");
  headElement.appendChild(g);
}

