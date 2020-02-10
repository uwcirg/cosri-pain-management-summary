import FHIR from 'fhirclient';

fetch(`${process.env.REACT_APP_CONF_API_URL}/auth/auth-info`, {
  // include cookies in request
  credentials: 'include'
})
  .then((response)      => response.json())
  .then((launchContext) => FHIR.oauth2.authorize(launchContext))
  .catch((error)        => console.error(error));
