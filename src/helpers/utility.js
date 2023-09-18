import moment from "moment";
import {getEnv} from "../utils/envConfig";
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
  if (target == null || target === "") return false;
  if (isNaN(target)) return false;
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
  return qList.flat();
}

export function getDisplayDateFromISOString(isocDateString) {
  if (!isocDateString) return "--";
  const objDate = new Date(isocDateString);
  if (isNaN(objDate)) return "--";
  // need to account for timezone offset for a UTC date/time
  let tzOffset = objDate.getTimezoneOffset() * 60000;
  objDate.setTime(objDate.getTime() + tzOffset);
  const displayDate = objDate
    ? objDate.toLocaleString("en-us", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
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
    // if (copyToClipboard) {
    //   canvas.toBlob((blob) => {
    //     // try {
    //     //   navigator.clipboard.write([
    //     //     new window.ClipboardItem({ "image/png": blob }),
    //     //   ]);
    //     // } catch(e) {
    //     //   alert("Unable to copy image to clipboard.  See console for detail.");
    //     //   console.log("Unable to write image to clipboard ", e)
    //     // }
    // }
    // Now is done
    //console.log(canvas.toDataURL("image/png"));
  };
}

export function downloadSVGImage(event, svgElement, imageElementId, downloadFileName) {
  if (event) event.stopPropagation();
  if (!svgElement) return;
  const svgData = new XMLSerializer().serializeToString(svgElement);

  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");

  let img = document.querySelector(
    "#" + (imageElementId)
  );
  if (!img) {
    img = document.createElement("img");
    img.classList.add("print-image");
    img.style.zIndex = -1;
    img.style.position = "absolute";
    img.style.opacity = 0;
    document.body.appendChild(img);
  }
  img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    canvas.toBlob((blob) => {
      const imageURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = imageURL;
      link.download = downloadFileName ? downloadFileName : "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      document.body.removeChild(img);
    }, "image/png");
    // Now is done
    //console.log(canvas.toDataURL("image/png"));
  };
}
