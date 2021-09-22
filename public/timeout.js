var timeoutIntervalId = 0;
var waitForDOMIntervalId = 0;
var timeoutGUID = 0;
var scrollTickerId = 0;
var maxSessionTime = 1800; //in seconds, default to 30 minutes, modifiable based on access token exp
var logoutLocation = "/"; //default logout location, modifiable by config
var tokenInfo = {};


/*
 * decode Jwt token
 */
function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

/*
 * get access token information stored in sessionStorage
 */
function getSessionTokenInfo() {
  var keys = Object.keys(sessionStorage);
  keys.forEach(function(key){
    var obj;
    try {
      obj = JSON.parse(sessionStorage.getItem(key));
    } catch(e) {
      obj = null;
    }
    if (obj && obj["tokenResponse"] && obj["tokenResponse"]["access_token"]) {
      tokenInfo = parseJwt(obj["tokenResponse"]["access_token"]);
    }
    console.log("token info? ", tokenInfo);
  });
}

/*
 * set maximum session time based on token exp value, if available
 */
function setSessionMaxTime() {
  if (!tokenInfo && !tokenInfo.exp) return;
  var expiredDateTime = new Date(tokenInfo.exp * 1000);
  var totalTime = (expiredDateTime.getTime() - Date.now());
  if (totalTime <= 0) return;
  maxSessionTime = totalTime / 1000; //in seconds
}


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
  var customLogoutLocationAttr = domElement ? domElement.getAttribute("logoutlocation") : null;
  if (customLogoutLocationAttr) logoutLocation = customLogoutLocationAttr;
  //set unique timeout tracking session id
  timeoutGUID = _createUUID();
  console.log("timeout counting starts ");
  //get expiration date/time to determine how long session is?
  getSessionTokenInfo();
  //what happens if token expires but user active??
  setSessionMaxTime();
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
 * will not logout user when is active
 */
//TODO figure out what to do here, if user is active but access token expires.
// WHAT THE HECK TO DO HERE??
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
