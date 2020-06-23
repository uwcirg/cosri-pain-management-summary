import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import FHIR from 'fhirclient';
import {getEnv, fetchEnvData} from './utils/envConfig';

//make sure REACT environmental variables have been populated;
fetchEnvData();

// retrieve launch context from backend, if configured
let context_url = getEnv("PUBLIC_URL") + '/launch-context.json';
if (getEnv("REACT_APP_CONF_API_URL")){
  context_url = getEnv("REACT_APP_CONF_API_URL") +'/auth/auth-info';
}

fetch(context_url, {
  // include cookies in request
  credentials: 'include'
})
.then((response)      => response.json())
.then((launchContext) => {
  FHIR.oauth2.authorize(launchContext);
})
.catch((error)        => console.error(error));
