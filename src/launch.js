import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import FHIR from "fhirclient";
import { getEnv, fetchEnvData } from "./utils/envConfig";
import { getEnvConfidentialAPIURL } from "./helpers/utility";
//make sure REACT environmental variables have been populated;
fetchEnvData();

// retrieve launch context from backend, if configured
let context_url = getEnv("PUBLIC_URL") + "/launch-context.json";
const confidentialAPIUrl = getEnvConfidentialAPIURL();
if (confidentialAPIUrl) {
  context_url = confidentialAPIUrl + "/auth/auth-info";
}

fetch(context_url, {
  // include cookies in request
  credentials: "include",
})
  .then((response) => response.json())
  .then((launchContext) => {
    FHIR.oauth2.authorize(launchContext);
  })
  .catch((error) => console.error(error));
