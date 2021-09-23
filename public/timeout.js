var timeoutIntervalId = 0;
var waitForDOMIntervalId = 0;
var timeoutGUID = 0;
var scrollTickerId = 0;
var sessionLifetime = 1800; //in seconds, default to 30 minutes, modifiable based on access token exp when applicable
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
  });
  console.log("token info? ", tokenInfo);
}

/*
 * set maximum session time based on token exp value, if available
 */
function setSessionMaxTime() {
  if (!tokenInfo && !tokenInfo.exp) return;
  //JWT token exp is number of seconds (not milliseconds) since Epoch
  var expiredDateTime = new Date(tokenInfo.exp * 1000); //javascript requires miliseconds since Epoch so need to multiple exp times 1000
  var totalTime = (expiredDateTime.getTime() - Date.now());
  if (totalTime <= 0) return;
  sessionLifetime = (totalTime / 1000); //in seconds
}

function initTimeoutIdentifier() {
   //set unique timeout countdown tracking interval id
   timeoutGUID = _createUUID();
}

/*
 * unique timeout interval identifier
 */
function getTimeoutIdentifier() {
  return "timeOnLoad_"+timeoutGUID;
}

/*
 * reset timeout countdown
 */
function resetTimeout() {
  clearInterval(timeoutIntervalId);
  window.localStorage.removeItem(getTimeoutIdentifier());
}
/*
 * set initial app access time when app loads
 */
function setTimeOnLoad() {
  window.localStorage.setItem(getTimeoutIdentifier(), Date.now());
}
/*
 * return the initial app access time
 */
function getLastActiveTime(){
  let storedActiveTime = window.localStorage.getItem(getTimeoutIdentifier());
  return storedActiveTime ? storedActiveTime : Date.now();
}
/*
* check how much time has elapsed, if exceeds session lifetime, redirect to specified logout location
*/
function checkTimeout() {
  let timeElapsed = (Date.now() - getLastActiveTime()) / 1000;
  console.log("time elapsed since first visiting ", timeElapsed);
  if (timeElapsed > sessionLifetime) { //session has expired
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
 * initialized timeout interval countdown timer
 */
function startTimeoutTimer() {
  var domElement = document.querySelector(".landing");
  var customLogoutLocationAttr = domElement ? domElement.getAttribute("logoutlocation") : null;
  if (customLogoutLocationAttr) logoutLocation = customLogoutLocationAttr;
  clearTimeout(timeoutIntervalId);
  console.log("timeout counting starts ");
  //get expiration date/time to determine how long a session is?
  getSessionTokenInfo();
  //get the lifetime of a session
  setSessionMaxTime();
  //record timestamp that the site is first accessed
  setTimeOnLoad();
  //check whether session has expired every 15 seconds
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
//TODO figure out what to do here, if user is active but access token expires?
// currently just extends session lifetime without logging out user
function resetTimeoutEvents() {
  document.querySelector(".App").addEventListener("click", function() {
    startTimeoutTimer();
  });
  document.addEventListener("scroll", function() {
    window.requestAnimationFrame(function() {
      console.log("time out interval reset");
      clearTimeout(scrollTickerId);
      scrollTickerId = setTimeout(function() {
        startTimeoutTimer();
      }, 250);
    });
  });
}
window.addEventListener('DOMContentLoaded', function(){
  waitForDOMIntervalId = setInterval(function() {
    if (isDOMReady()) {
      //assign id to the specific countdown timer id for this session
      initTimeoutIdentifier();
      //start count down
      startTimeoutTimer();
      //initiate user event(s) that will reset timeout countdown
      resetTimeoutEvents();
    }
  }, 50);
});
