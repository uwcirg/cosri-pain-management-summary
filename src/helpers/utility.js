import moment from "moment";
import { toBlob, toJpeg } from "html-to-image";
import { getEnv } from "../utils/envConfig";
import reportSummarySections from "../config/report_config";

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
  let tzOffset = dObj.getTimezoneOffset() * 60000;
  dObj.setTime(dObj.getTime() + tzOffset);
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
  if (typeof target === "number") return true;
  if (target == null || String(target).trim() === "") return false;
  return !isNaN(target);
}

export function getEnvInstrumentList() {
  const envList = getEnv("REACT_APP_SCORING_INSTRUMENTS");
  return envList ? String(envList).replace(/_/g, " ") : "";
}

export function getReportInstrumentList() {
  const qList = reportSummarySections
    .filter((section) => section.questionnaires)
    .map((section) => section.questionnaires);
  if (!qList.length) return null;
  return [...new Set(qList.flat())];
}

export function getDisplayDateFromISOString(isocDateString, format) {
  if (!isocDateString) return "--";
  const objDate = new Date(isocDateString);
  if (isNaN(objDate)) return "--";
  // need to account for timezone offset for a UTC date/time
  let tzOffset = objDate.getTimezoneOffset() * 60000;
  objDate.setTime(objDate.getTime() + tzOffset);
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
  if (!svgElement) return;
  const svgData = new XMLSerializer().serializeToString(svgElement);
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  let img = imageElement;
  if (!img) return;
  img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
  };
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
    typeof svgElement.clientWidth !== undefined ? svgElement.clientWidth : 0;
  const height =
    typeof svgElement.clientHeight !== undefined ? svgElement.clientHeight : 0;
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
      alert("Error! Unable to copy content to clipboard! " + e);
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

export function toDate(stringDate) {
  if (stringDate instanceof Date) return stringDate;
  return new Date(stringDate);
}

export function getPatientNameFromSource(fhirPatientSource) {
  if (!fhirPatientSource) return "";
  if (!fhirPatientSource.name || !fhirPatientSource.name.length) return "";
  const firstName =
    fhirPatientSource.name[0].given && fhirPatientSource.name[0].given.length
      ? fhirPatientSource.name[0].given[0]
      : "";
  const lastName = fhirPatientSource.name[0].family;
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
