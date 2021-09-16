var timeoutIntervalId = 0;
var waitForDOMIntervalId = 0;
var timeoutGUID = 0;
var scrollTickerId = 0;
var maxSessionTime = 1800; //in seconds, default to 30 minutes, modifiable by config
var logoutLocation = "/logout?time_out=true"; //default logout location, modifiable by config

/*
 * unique timeout session identifier
 */
function getTimeoutIdentifier() {
  return "timeOnLoad_"+timeoutGUID;
}

/*
 * reset timeout count
 */
function resetTimeout() {
  clearInterval(timeoutIntervalId);
  window.localStorage.removeItem(getTimeoutIdentifier());
}
/*
 * set initial time when app loads
 */
function setTimeOnLoad() {
  window.localStorage.setItem(getTimeoutIdentifier(), Date.now());
}
/*
 * return the initial app loaded time
 */
function getLastActiveTime(){
  let storedActiveTime = window.localStorage.getItem(getTimeoutIdentifier());
  return storedActiveTime ? storedActiveTime : Date.now();
}
/*
* check how much time has elapsed, if exceeds maximum session time, redirect to logout
*/
function checkTimeout() {
  let timeElapsed = (Date.now() - getLastActiveTime()) / 1000;
  console.log("time elapsed ", timeElapsed);
  if (timeElapsed > maxSessionTime) {
    //logout user?
    window.location = logoutLocation;
  }
}

function isDOMReady() {
  var targetNode = document.querySelector(".landing");
  if (!targetNode) return false;
  clearInterval(waitForDOMIntervalId);
  return true;
}

/*
 * initialized timeout timer
 */
function startTimeoutTimer() {
  var domElement = document.querySelector(".landing");
  var customSessionTimeAttr = domElement ? domElement.getAttribute("maxsessiontime") : null;
  var customLogoutLocationAttr = domElement ? domElement.getAttribute("logoutlocation") : null;
  //set customized session lifetime and logout url
  if (customSessionTimeAttr) maxSessionTime = customSessionTimeAttr;
  if (customLogoutLocationAttr) logoutLocation = customLogoutLocationAttr;
  //set unique timeout tracking session id
  timeoutGUID = _createUUID();
  console.log("timeout timer reset");
  resetTimeoutEvents();
  setTimeOnLoad();
  timeoutIntervalId = setInterval(checkTimeout, 15000);
}

function _createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
     var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
     return v.toString(16);
  });
}

/*
 * initialize user events that will reset the timeout timer
 */
function resetTimeoutEvents() {
  document.querySelector(".App").addEventListener("click", function() {
    startTimeoutTimer();
  });
  document.addEventListener("scroll", function() {
    window.requestAnimationFrame(function() {
      console.log("time out reset");
      clearTimeout(scrollTickerId);
      setTimeout(function() {
        startTimeoutTimer();
      }, 250);
    });
  });
}
window.addEventListener('DOMContentLoaded', function(){
  waitForDOMIntervalId = setInterval(function() {
    if (isDOMReady()) {
      startTimeoutTimer();
    }
  }, 50);
});
