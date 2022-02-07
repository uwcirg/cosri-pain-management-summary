import moment from 'moment';
/*
 * return number of days between two dates
 * @params dateString1 date #1 to be compared
 *         dateString2 date #2 to be compared
 */
export function getDiffDays(dateString1, dateString2) {
    if (!dateString1 || ! dateString2) return 0;
    //set two date variables
    let date1 = new Date(dateString1), date2 = new Date(dateString2);
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
    let dtEndDate = endDate? endDate : new Date();
    let dtStartDate = startDate? startDate : new Date();
    return moment(dtEndDate).diff(dtStartDate, 'months', true);
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
export function isInViewport (elem) {
    if (!elem) return false;
    var bounding = elem.getBoundingClientRect();
    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

/*
 * @param array of numbers
 * @return the sum of numbers in the array
 */
export function sumArray (array) {
    if (!array || !Array.isArray(array) || !array.length) return 0;
    return array.reduce((a, b) => (isNaN(a)?0:a) + (isNaN(b)?0:b));
}

/*
 * @param a date string
 * @param return number of days difference of date input from today
 */
export function daysFromToday (dateInput) {
    const today = (new Date());
    let originalDate = (new Date(dateInput));
    let dObj = new Date(originalDate.valueOf()); //get copy of date so as not to mutate the original date
    let tzOffset = dObj.getTimezoneOffset() * 60000;
    dObj.setTime(dObj.getTime() + tzOffset);
    let oneDay = (1000 * 60 * 60 * 24);
    let diff = (today.setHours(0,0,0,0) - dObj.setHours(0,0,0,0)) / oneDay;
    //console.log("date " , dateInput, " dif ", diff)
    if (isNaN(diff)) return 0;
    return diff;
}
