import {getEnv, fetchEnvData} from '../utils/envConfig';

var Timeout = (function() {
  var timeoutIntervalId = 0;
  var waitForDOMIntervalId = 0;
  var timeoutGUID = 0;
  var scrollTickerId = 0;
  var defaultTimetime = 1800;
  var sessionLifetime = 1800; //in seconds, default to 30 minutes, modifiable based on access token exp when applicable
  var logoutLocation = "/"; //default logout location, modifiable by config
  var tokenInfo = {};

  /*
   * check if the system type is production
   */
  function isProduction() {
    return (getEnv("REACT_APP_DASHBOARD_URL") && String(getEnv("REACT_APP_SYSTEM_TYPE")).toLowerCase() !== "development");
  }

  /*
   * print debug statement only in development instance
   */
  function printDebugStatement(message) {
    if (isProduction()) return;
    console.log(message);
  }

  /*
   * set logout location
   */
  function setLogoutLocation() {
    if (!getEnv("REACT_APP_DASHBOARD_URL")) {
      printDebugStatement("No environment variable available. logout location " + logoutLocation);
      return;
    }
    var loc = getEnv("REACT_APP_DASHBOARD_URL") + "/logout?timeout=true";
    logoutLocation = loc;
    printDebugStatement("Logout location " + logoutLocation);
    return  loc; //this should log to the server
  }

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
    printDebugStatement("token info? " + (tokenInfo?JSON.stringify(tokenInfo):"no token"));
  }

  /*
  * set maximum session time based on token exp value, if available
  */
  function setSessionMaxTime() {
    if (!tokenInfo && !tokenInfo.exp) {
      sessionLifetime = defaultTimetime;
      printDebugStatement("No token info available");
      return;
    }
    //JWT token exp is number of seconds (not milliseconds) since Epoch
    var expiredDateTime = new Date(tokenInfo.exp * 1000); //javascript requires miliseconds since Epoch so need to multiple exp times 1000
    var totalTime = (expiredDateTime.getTime() - Date.now());
    if (totalTime <= 0) {
      printDebugStatement("Token expired");
      return;
    }
    sessionLifetime = (totalTime / 1000); //in seconds
    printDebugStatement("Session lifetime " + sessionLifetime);
  }

  /*
   * set unique id for each timeout tracking interval
   */
  function initTimeoutIdentifier() {
    var jti = tokenInfo && tokenInfo.jti ? tokenInfo.jti : null;
    var client_id = tokenInfo && tokenInfo.client_id ? tokenInfo.client_id : null;
    var tokenId = jti ? jti : client_id;
    //set unique timeout countdown tracking interval id
    timeoutGUID = (tokenId ? tokenId : _createUUID());
    printDebugStatement("identifier ? " + timeoutGUID);
  }

  /*
  * unique timeout interval identifier
  */
  function getTimeoutIdentifier() {
    return "timeOnLoad_"+timeoutGUID;
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

  function isAboutToExpire() {
    let timeElapsed = (Date.now() - getLastActiveTime()) / 1000;
    return (sessionLifetime - timeElapsed) <= 60;
  }

  function isExpired() {
    let timeElapsed = (Date.now() - getLastActiveTime()) / 1000;
    return timeElapsed >= sessionLifetime;
  }
  /*
  * check how much time has elapsed, if exceeds session lifetime, redirect to specified logout location
  */
  function checkTimeout() {
    let timeElapsed = (Date.now() - getLastActiveTime()) / 1000;
    if (isAboutToExpire()) {
      //if session is about to expire, pop up modal to inform user as such and then redirect back to patient search
      openModal();
      //back to patient search
      setTimeout(function() {
        window.location = getEnv("REACT_APP_DASHBOARD_URL");
      }, 5000);
      printDebugStatement("Session about to expire. Time elapsed since first visiting " + timeElapsed);
      return;
    }
    if (isExpired()) { //session has expired
      //logout user?
      window.redirectToLogout();
    }
  }

  window.redirectToLogout = function redirectToLogout() {
    window.location = logoutLocation;
  }

  function isDOMReady() {
    //DOM root element, it could be an error element indicating null state
    var targetNode = document.querySelector(".landing") || document.querySelector(".root-error");
    if (!targetNode) return false;
    clearInterval(waitForDOMIntervalId);
    return true;
  }

  /*
  * initialized timeout interval countdown timer
  */
  function startTimeoutTimer() {
    clearTimeout(timeoutIntervalId);
    printDebugStatement("timeout counting starts ");
    //get the lifetime of a session
    setSessionMaxTime();
    //record timestamp that the site is first accessed
    setTimeOnLoad();
    //check whether session has expired every 15 seconds
    timeoutIntervalId = setInterval(checkTimeout, 15000);
  }

  function _createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      /* eslint-disable */
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /*
  * initialize user events that will reset the timeout timer
  * will not logout user when is active
  */
  function resetTimeoutEvents() {
    document.querySelector(".App").addEventListener("click", function() {
      checkTimeout();
      startTimeoutTimer();
    });
    document.addEventListener("scroll", function() {
      window.requestAnimationFrame(function() {
        printDebugStatement("time out count resets when scrolling");
        clearTimeout(scrollTickerId);
        scrollTickerId = setTimeout(function() {
          checkTimeout();
          startTimeoutTimer();
        }, 250);
      });
    });
  }
  function handleNoToken() {
    getSessionTokenInfo();
    if (!tokenInfo || !Object.keys(tokenInfo).length) {
      //back to dashboard
      window.location = getEnv("REACT_APP_DASHBOARD_URL") + "/home";
      clearInterval(waitForDOMIntervalId);
    }
  }
  function getModalElement() {
    return document.querySelector("#timeoutModal");
  }
  function openModal() {
    var modalElement = getModalElement();
    if (!modalElement) return;
    modalElement.classList.add("modal-open");
    modalElement.classList.remove("modal-close");
    document.querySelector("body").classList.add("fixed");
    document.querySelector("body").classList.add("ReactModal__Body--open");
  }
  function initTimeoutModal() {
    if (getModalElement()) return;
    var modalElement = document.createElement("div");
    modalElement.setAttribute("id", "timeoutModal");
    modalElement.classList.add("modal-close");
    modalElement.innerHTML = `<div class="ReactModal__Overlay ReactModal__Overlay--after-open overlay">
      <div class="ReactModal__Content ReactModal__Content--after-open modal small" tabindex="-1" role="dialog" aria-label="Timeout notice">
          <div class="info-modal">
              <div class="info-modal__header">Session Timeout Notice</div>
              <div class="info-modal__content text-bold">
                <h2 class="error">Your session is about to time out.</h2>
                <p>One moment while we redirect you back...</p>
              </div>
              <div class="info-modal__buttonsContainer"><button class="button-default" onClick="window.redirectToLogout()">Log out</button></div>
          </div>
      </div>
    </div>`;
    document.body.appendChild(modalElement);
  }
  function init() {
    waitForDOMIntervalId = setInterval(function() {
      if (isDOMReady()) {
        fetchEnvData();
        //set logout location
        setLogoutLocation();
        //get expiration date/time to determine how long a session is?
        getSessionTokenInfo();
        //on page load, check if token is not present?
        handleNoToken();
        //assign id to the specific countdown timer id for this session
        initTimeoutIdentifier();
        //set timeout modal
        initTimeoutModal();
        //start count down
        startTimeoutTimer();
        //initiate user event(s) that will reset timeout countdown
        //resetTimeoutEvents();
      }
    }, 50);
  }
  init();
});
export default Timeout;
