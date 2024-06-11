export function fetchEnvData() {
  if (window["appConfig"] && Object.keys(window["appConfig"]).length) {
    console.log("Window config variables added. ");
    return;
  }
  let xhr = new XMLHttpRequest();
  const setConfig = function () {
    if (!xhr.readyState === xhr.DONE) {
      return;
    }
    if (xhr.status !== 200) {
      console.log("Request failed! ");
      return;
    }
    let envObj = null;
    try {
      envObj = JSON.parse(xhr.responseText);
    } catch (e) {
      console.log("Parsing error ", e);
    }
    window["appConfig"] = {};
    //assign window process env variables for access by app
    //won't be overridden when Node initializing env variables
    if (envObj) {
      for (var key in envObj) {
        if (!window["appConfig"][key]) {
          window["appConfig"][key] = envObj[key];
        }
      }
    }
  };
  xhr.open("GET", "/env.json", false);
  xhr.onreadystatechange = function () {
    //in the event of a communication error (such as the server going down),
    //or error happens when parsing data
    //an exception will be thrown in the onreadystatechange method when accessing the response properties, e.g. status.
    try {
      setConfig();
    } catch (e) {
      console.log("Caught exception " + e);
    }
  };
  try {
    if (xhr) {
      xhr.send();
    }
  } catch (e) {
    console.log("Request failed to send.  Error: ", e);
  }
  xhr.ontimeout = function (e) {
    // XMLHttpRequest timed out.
    console.log("request to fetch env.json file timed out ", e);
  };
  xhr.onerror = (e) => {
    console.log(e);

  }
  return xhr;
}

export function getEnv(key) {
  //window application global variables
  if (window["appConfig"] && window["appConfig"][key])
    return window["appConfig"][key];
  const envDefined = typeof process !== "undefined" && process.env;
  //enviroment variables as defined by Node
  if (envDefined && process.env[key]) return process.env[key];
  return "";
}

export function getEnvs() {
  let arrEnvs = [];
  const blacklist = ["SECRET", "KEY", "TOKEN", "CREDENTIALS"];
  if (window["appConfig"]) {
    const keys = Object.keys(window["appConfig"]);
    keys.forEach((key) => {
      if (blacklist.indexOf(key.toUpperCase()) !== -1) return true;
      arrEnvs.push({ key: key, value: window["appConfig"][key] });
    });
  }
  const envDefined = typeof process !== "undefined" && process.env;
  if (envDefined) {
    const envKeys = Object.keys(process.env);
    envKeys.forEach((key) => {
      if (blacklist.indexOf(key.toUpperCase()) !== -1) return true;
      arrEnvs.push({ key: key, value: process.env[key] });
    });
  }

  console.log("Environment variables ", arrEnvs);
  return arrEnvs;
}
