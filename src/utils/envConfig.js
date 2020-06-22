export function fetchEnvData() {
    //const envDefined = (typeof process !== "undefined") && process.env;
    // if (envDefined) {
    //     console.log("ENVIRONMENT DEFINED??? ", process.env);
    //     let envKeys = Object.keys(process.env);
    //     let arrLoaded = envKeys.filter(item => {
    //         return item.startsWith("REACT_");
    //     });
    //     console.log("filtered env array? ", arrLoaded);
    //     if (arrLoaded.length) {
    //         //REACT environmental variables have been loaded, note, this is true in dev environment
    //         console.log("env vars loaded!")
    //         //return;
    //     }
    // }
    if (window["appConfig"] && Object.keys(window["appConfig"]).length) {
        console.log("window config Added? ")
        return;
    }
    const setConfig = function () {
        if (!xhr.readyState === xhr.DONE) {
            return;
        }
        if (xhr.status !== 200) {
            console.log("Request failed! ");
            return;
        }
        var envObj = JSON.parse(xhr.responseText);
        // if (!envDefined) {
        //     window["process"] = {};
        //     window["process"]["env"] = {};
        // }
        window["appConfig"] = {};
        //assign window process env variables for access by app
        for (var key in envObj) {
            console.log("GET KEY ? ", key, " value? ", envObj[key])
            if (!window["appConfig"][key]) {
                console.log("ONLY GET HERE IF NOT DEFINED ", key)
                window["appConfig"][key] = envObj[key];
            }
        }
        console.log("loaded from env json ",  window["appConfig"])
    };
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/env.json", false);
    xhr.onreadystatechange = function() {
        //in the event of a communication error (such as the server going down),
        //or error happens when parsing data
        //an exception will be thrown in the onreadystatechange method when accessing the response properties, e.g. status. 
        try {
            setConfig();
        } catch(e) {
            console.log("Caught exception " + e);
        }
    };
    xhr.send();
    xhr.ontimeout = function (e) {
        // XMLHttpRequest timed out.
        console.log("request to fetch env.json file timed out ", e);
    };
}

export function getEnv (key) {
    const envDefined = (typeof process !== "undefined") && process.env;
    if (envDefined && process.env[key]) return process.env[key];
    if (window["appConfig"] && window["appConfig"][key]) return window["appConfig"][key];
    return "";
}
