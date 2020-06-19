(function() {
    var xhr = new XMLHttpRequest();
    function fetchData() {
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
    function setConfig() {
        if (!xhr.readyState === xhr.DONE) {
            return;
        }
        if (xhr.status !== 200) {
            console.log("Request failed! ");
            return;
        }
        var envObj = JSON.parse(xhr.responseText);
        if (!window.process) {
            window.process = {};
            if (!window.process.env) {
                window.process.env = {};
            }
        }
        //assign window process env variables for access by app
        for (var key in envObj) {
            window.process.env[key] = envObj[key];
        }
    }
    window.onload = fetchData;
})();
