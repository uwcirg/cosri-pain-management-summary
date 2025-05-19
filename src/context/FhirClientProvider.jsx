import { useEffect, useReducer } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import FHIR from "fhirclient";
import { fetchEnvData } from "../utils/envConfig";
import { FhirClientContext } from "./FhirClientContext";
import { getPatientSearchURL } from "../helpers/utility";

export default function FhirClientProvider(props) {
  const reducer = (state, action) => {
    return {
      ...state,
      ...action,
    };
  };

  const [state, dispatch] = useReducer(reducer, {
    client: null,
    patient: null,
    error: null,
  });

  const getPatient = async (client) => {
    if (!client) throw new Error("Invalid FHIR client.");
    //this is a workaround for when patient id is NOT embedded within the JWT token
    const queryPatientIdKey = "launch_queryPatientId";
    let queryPatientId = sessionStorage.getItem(queryPatientIdKey);
    if (queryPatientId) {
      console.log("Using stored patient id ", queryPatientId);
      return client.request("/Patient/" + queryPatientId);
    }
    // Get the Patient resource
    const id = await client.patient.read().catch((e) => {
      throw new Error(e);
    });
    return id;
  };

  useEffect(() => {
    Promise.allSettled([
      FHIR?.oauth2 ? FHIR?.oauth2?.ready() : () => ({}),
      fetchEnvData(),
    ]).then(
      (results) => {
        if (results[0].status === "rejected") {
          dispatch({
            error: results[0].reason ?? "Auth error.",
          });
          return;
        }
        console.log("Auth complete, client ready.");
        const client = results[0].value;

        console.log("patient? ", client);

        getPatient(client)
          .then((result) => {
            console.log("Patient loaded.");
            dispatch({
              client: client,
              patient: result,
            });
          })
          .catch((e) => {
            dispatch({
              error: e,
            });
          });
      },
      (error) => {
        console.log("Auth error: ", error);
        dispatch({
          error: error,
        });
      }
    );
  }, []);

  return (
    <FhirClientContext.Provider value={state}>
      <FhirClientContext.Consumer>
        {({ client, error }) => {
          // any auth error that may have been rejected with
          if (error) {
            return (
              <div className="banner error root-error">
                <div>
                  <FontAwesomeIcon icon={faExclamationCircle} title="error" />{" "}
                  Application error: See console for details.
                </div>
                <div className="banner__linkContainer">
                  <a href={getPatientSearchURL(true)}>Back to Patient Search</a>
                </div>
              </div>
            );
          }

          // if client is available render the children component(s)
          if (client) {
            return props.children;
          }

          // client is undefined until auth.ready() is fulfilled
          return <div style={{ padding: "24px" }}>Authorizing...</div>;
        }}
      </FhirClientContext.Consumer>
    </FhirClientContext.Provider>
  );
}

FhirClientProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]),
};
