(function() {
    var timeoutIntervalId = 0;
    var waitForDOMIntervalId = 0;
    var timeoutGUID = 0;
    var scrollTickerId = 0;
    var defaultTimetime = 1800;
    var sessionLifetime = 1800; //in seconds, default to 30 minutes, modifiable based on access token exp when applicable
    var logoutLocation = "/"; //default logout location, modifiable by config
    var tokenInfo = {};

    function getEnv (key) {
        //window application global variables
        if (window["appConfig"] && window["appConfig"][key]) return window["appConfig"][key];
        const envDefined = (typeof process !== "undefined") && process.env;
        //enviroment variables as defined by Node
        if (envDefined && process.env[key]) return process.env[key];
        return "";
    }

    /*
     * check if the system type is production
     */
    function isProduction() {
        console.log("Env url? ", getEnv("REACT_APP_DASHBOARD_URL"))
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
      var loc = getEnv("REACT_APP_DASHBOARD_URL")+"/clear_session";
      printDebugStatement("Logout location " + loc);
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
      //set unique timeout countdown tracking interval id
      timeoutGUID = (jti ? jti : _createUUID());
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
    /*
    * check how much time has elapsed, if exceeds session lifetime, redirect to specified logout location
    */
    function checkTimeout() {
      let timeElapsed = (Date.now() - getLastActiveTime()) / 1000;
      printDebugStatement("time elapsed since first visiting " + timeElapsed);
      if (timeElapsed >= sessionLifetime) { //session has expired
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
    //TODO figure out what to do here, if user is active but access token expires?
    // currently just reset countdown without logging out user
    function resetTimeoutEvents() {
      document.querySelector(".App").addEventListener("click", function() {
        startTimeoutTimer();
      });
      document.addEventListener("scroll", function() {
        window.requestAnimationFrame(function() {
          printDebugStatement("time out interval reset");
          clearTimeout(scrollTickerId);
          scrollTickerId = setTimeout(function() {
            startTimeoutTimer();
          }, 250);
        });
      });
    }
    function init() {
      waitForDOMIntervalId = setInterval(function() {
        if (isDOMReady()) {
          //fetchEnvData();
          //set logout location
          setLogoutLocation();
          //get expiration date/time to determine how long a session is?
          getSessionTokenInfo();
          //assign id to the specific countdown timer id for this session
          initTimeoutIdentifier();
          //start count down
          startTimeoutTimer();
          //initiate user event(s) that will reset timeout countdown
          resetTimeoutEvents();
        }
      }, 50);
    }
    init();
  })();
