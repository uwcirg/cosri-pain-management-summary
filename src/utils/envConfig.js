export async function fetchEnvData() {
  if (
    window &&
    window["appConfig"] &&
    Object.keys(window["appConfig"]).length
  ) {
    console.log("Window config variables added. ");
    return;
  }
  const url = "/env.json";
  if (window) window["appConfig"] = {};
  try {
    const response = await fetch(url).catch((e) => {
      console.log(e);
    });
    if (!response?.ok) {
      console.log(
        `Error fetching env.json. Rsponse status: ${response?.status}`
      );
      return;
    }
    const envObj = await response.json().catch((e) => {
      console.log(e);
    });
    // assign window process env variables for access by app
    // won't be overridden when Node initializing env variables
    if (envObj && window) {
      for (var key in envObj) {
        if (!window["appConfig"][key]) {
          window["appConfig"][key] = envObj[key];
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
}

export function getEnv(key) {
  //window application global variables
  if (window && window["appConfig"] && window["appConfig"][key])
    return window["appConfig"][key];
  const envDefined = import.meta && import.meta.env;
  //enviroment variables as defined by Node
  if (envDefined && import.meta.env[key]) return import.meta.env[key];
  return "";
}

export function getEnvs() {
  let arrEnvs = [];
  const blacklist = ["SECRET", "KEY", "TOKEN", "CREDENTIALS"];
  if (window && window["appConfig"]) {
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

export const ENV_VAR_PREFIX = "REACT_APP";
