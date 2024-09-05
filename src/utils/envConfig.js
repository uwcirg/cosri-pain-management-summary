export function fetchEnvData() {
  if (window["appConfig"] && Object.keys(window["appConfig"]).length) {
    console.log("Window config variables added. ");
    return;
  }
  const setConfig = function (xhr) {
    if (!xhr) return;
    if (!xhr.readyState === xhr.DONE) {
      return;
    }
    if (xhr.status !== 200) {
      console.log("Request failed! ");
      return;
    }
    var envObj = JSON.parse(xhr.responseText);
    window["appConfig"] = {};
    //assign window process env variables for access by app
    //won't be overridden when Node initializing env variables
    for (var key in envObj) {
      if (!window["appConfig"][key]) {
        window["appConfig"][key] = envObj[key];
      }
    }
  };
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/env.json", false);
  xhr.onreadystatechange = function () {
    //in the event of a communication error (such as the server going down),
    //or error happens when parsing data
    //an exception will be thrown in the onreadystatechange method when accessing the response properties, e.g. status.
    try {
      setConfig(xhr);
    } catch (e) {
      console.log("Caught exception " + e);
    }
  };
  try {
    xhr.send();
  } catch (e) {
    console.log("Request failed to send.  Error: ", e);
  }
  xhr.ontimeout = function (e) {
    // XMLHttpRequest timed out.
    console.log("request to fetch env.json file timed out ", e);
  };
}

export function getEnv(key) {
  //window application global variables
  if (window["appConfig"] && window["appConfig"][key])
    return window["appConfig"][key];
  const envDefined = import.meta && import.meta.env;
  //enviroment variables as defined by Node
  if (envDefined && import.meta.env[key]) return import.meta.env[key];
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
  //const envDefined = typeof process !== "undefined" && process.env;
  const envDefined = import.meta && import.meta.env;
  if (envDefined) {
    const envKeys = Object.keys(import.meta.env);
    envKeys.forEach((key) => {
      if (blacklist.indexOf(key.toUpperCase()) !== -1) return true;
      arrEnvs.push({ key: key, value: import.meta.env[key] });
    });
  }

  console.log("Environment variables ", arrEnvs);
  return arrEnvs;
}

export const ENV_VAR_PREFIX = "VITE_APP";
