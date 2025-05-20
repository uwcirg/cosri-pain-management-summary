import React, { useEffect, useContext, useReducer } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ChevronDownIcon from "../../icons/ChevronDownIcon";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FhirClientContext } from "../../context/FhirClientContext";
import {
  addMonthsToDate,
  getUserIdFromAccessToken,
  noCacheHeader,
} from "../../helpers/utility";
import {
  alertProps,
  getCommunicationPayload,
  getCommunicationRequestPayload,
  getDisplayDate,
  getEndDateFromCommunicationRequest,
  getMostRecentCommunicationBySentFromBundle,
  getMostRecentCommunicationRequestByEndDateFromBundle,
  isAboutDue,
  isOverDue,
  isNotDueYet,
  shouldDisplayAlert,
} from "./utility";

export default function AlertBanner({ type, summaryData }) {
  const context = useContext(FhirClientContext);
  const { client, patient } = context;

  const contextReducer = (contextState, action) => {
    if (!action) return contextState;
    const keys = Object.keys(action);
    if (!keys || !keys.length) return contextState;
    let updatedVars = {};
    keys.forEach((key) => {
      updatedVars[key] = action[key];
    });
    return {
      ...contextState,
      ...updatedVars,
    };
  };
  const [contextState, contextStateDispatch] = useReducer(contextReducer, {
    loading: true,
    expanded: false,
    savingInProgress: false,
    currentCommunicationRequest: null,
    currentCommunication: null,
    // possible values : due, completed
    status: null,
    dueDate: null,
    lastAcknowledgedDate: null,
    error: null,
  });

  const alertType = type ?? "naloxone";
  const currentAlertProps = alertProps[alertType];
  const userId = getUserIdFromAccessToken();
  const dataParams = {
    userId: userId,
    patient: patient,
    ...currentAlertProps,
  };

  const handleCloseToggle = () => {
    contextStateDispatch({
      expanded: !contextState.expanded,
    });
  };

  const handleInputClick = (e) => {
    if (e) e.stopPropagation();
    contextStateDispatch({
      savingInProgress: true,
    });
    client
      .create(
        getCommunicationPayload(
          dataParams,
          contextState.currentCommunicationRequest?.id
        )
      )
      .then((result) => {
        if (result && result.sent) {
          if (contextState.currentCommunicationRequest) {
            contextState.currentCommunicationRequest.status = "completed";
            client
              .update(contextState.currentCommunicationRequest)
              .catch((e) => {
                console.log(
                  "Unable to mark CommunicationRequest as completed ",
                  e
                );
                contextStateDispatch({
                  error:
                    "Unable to complete saving of acknowledgement data. See console for detail.",
                });
              });
          }
          setTimeout(() => {
            contextStateDispatch({
              lastAcknowledgedDate: getDisplayDate(result.sent),
              savingInProgress: false,
              expanded: false,
              currentCommunication: result,
              status: "completed",
            });
          }, 350);
        } else {
          contextStateDispatch({
            error: "Unable to complete saving",
            savingInProgress: false,
          });
        }
      })
      .catch((e) => {
        console.log("Error creating communication ", e);
        contextStateDispatch({
          error: "Unable to save acknowledgement data. See console for detail.",
          savingInProgress: false,
        });
      });
    // setTimeout(() => {
    //   contextStateDispatch({
    //     viewedDate: todayDate,
    //     savingInProgress: false,
    //   });
    // }, 350);
  };

  const shouldShowAlert = shouldDisplayAlert(alertType, summaryData);

  useEffect(() => {
    if (!shouldShowAlert) {
      contextStateDispatch({
        loading: false,
      });
      return;
    }
    if (!client || !patient || !contextState.loading) return;

    Promise.allSettled([
      client.request({
        url: `Communication?category=${currentAlertProps.acknowledgedConceptCode}&patient=${patient.id}&_sort=-_lastUpdated`,
        headers: noCacheHeader,
      }),
      client.request({
        url: `CommunicationRequest?status=active&category=${currentAlertProps.alertConceptCode}&patient=${patient.id}&_sort=-_lastUpdated`,
        headers: noCacheHeader,
      }),
    ])
      .then((results) => {
        const commResults = results[0].value;
        const crResults = results[1].value;
        let currentCommunication =
          getMostRecentCommunicationBySentFromBundle(commResults);
        let currentCommunicationRequest =
          getMostRecentCommunicationRequestByEndDateFromBundle(crResults);
        let lastAcknowledgedDate = currentCommunication?.sent;

        const isNotDue = isNotDueYet(lastAcknowledgedDate);
        const crEndDate = getEndDateFromCommunicationRequest(
          currentCommunicationRequest
        );
        const shouldCreateCR =
          (lastAcknowledgedDate &&
            isOverDue(crEndDate) &&
            (isAboutDue(lastAcknowledgedDate) ||
              isOverDue(lastAcknowledgedDate))) ||
          !crEndDate ||
          isOverDue(crEndDate);

        // acknowledged and alert not due yet
        if (isNotDue) {
          contextStateDispatch({
            loading: false,
            status: "completed",
            lastAcknowledgedDate: lastAcknowledgedDate,
            currentCommunication: currentCommunication,
          });
          return;
        }
        if (shouldCreateCR) {
          // existing CR expired, create new CR
          client
            .create(
              getCommunicationRequestPayload({
                ...dataParams,
                startDate: isAboutDue(lastAcknowledgedDate)
                  ? lastAcknowledgedDate
                  : null,
                endDate: isAboutDue(lastAcknowledgedDate)
                  ? addMonthsToDate(lastAcknowledgedDate, 12)
                  : addMonthsToDate(null, 12),
                noteText: isAboutDue(lastAcknowledgedDate)
                  ? `Alert acknowledgement is about due. Last acknowledged on ${lastAcknowledgedDate}`
                  : isOverDue(lastAcknowledgedDate)
                  ? `Last acknowledgement was overdue. Last acknowledged on ${lastAcknowledgedDate}`
                  : null,
              })
            )
            .then((result) => {
              if (!result || !result.id) {
                contextStateDispatch({
                  loading: false,
                  error: "Unable to create resource for alert.",
                });
                return;
              }
              if (currentCommunicationRequest) {
                let prevCR = JSON.parse(
                  JSON.stringify(currentCommunicationRequest)
                );
                prevCR.status = "revoked";
                client.update(prevCR).catch((e) => {
                  console.log(
                    "Error occurred updating previous CommunicationRequest ",
                    e
                  );
                });
              }
              contextStateDispatch({
                loading: false,
                status: "due",
                expanded: true,
                lastAcknowledgedDate: lastAcknowledgedDate,
                dueDate: getEndDateFromCommunicationRequest(result),
                currentCommunication: currentCommunication,
                currentCommunicationRequest: result,
              });
            })
            .catch((e) => {
              console.log("Error creating CommunicationRequest ", e);
              contextStateDispatch({
                error:
                  "Unable to create resource data for alert. See console for detail.",
                loading: false,
              });
            });
        } else {
          // current CR has not expired yet
          contextStateDispatch({
            loading: false,
            status: "due",
            expanded: true,
            lastAcknowledgedDate: lastAcknowledgedDate,
            dueDate: crEndDate,
            currentCommunication: currentCommunication,
            currentCommunicationRequest: currentCommunicationRequest,
          });
        }
      })
      .catch((e) => {
        console.log(e);
        contextStateDispatch({
          loading: false,
          error: "Error occurred retrieving alert data.",
        });
      });
  }, [client, patient, shouldShowAlert]);

  const getAcknowledgedText = () => {
    if (!contextState.lastAcknowledgedDate) return "";
    return `last acknowledged on ${getDisplayDate(
      contextState.lastAcknowledgedDate
    )}${userId ? " by " + userId : ""}`;
  };

  const getAlertDisplayText = () => {
    if (!contextState.lastAcknowledgedDate)
      return "Please acknowledge this alert.";
    const byDate = addMonthsToDate(contextState.lastAcknowledgedDate, 12);
    if (isOverDue(contextState.lastAcknowledgedDate)) {
      return `This alert is overdue as of ${getDisplayDate(
        byDate
      )}.  Please acknowledge.`;
    }
    if (isAboutDue(contextState.lastAcknowledgedDate)) {
      return `This alert should be acknowledged by ${getDisplayDate(
        byDate
      )}.  Please acknowledge.`;
    }
    return "";
  };

  const getFoldedView = () => {
    return (
      <div className="flex flex-start">
        <span>{currentAlertProps.title}</span>
        {contextState.savingInProgress && (
          <span className="note">Saving ...</span>
        )}
        {!contextState.savingInProgress &&
          contextState.status !== "completed" && (
            <span className="info-text">(click arrow to see pending task)</span>
          )}
        {!contextState.savingInProgress &&
          contextState.status === "completed" && (
            <span className="note">{getAcknowledgedText()}</span>
          )}
      </div>
    );
  };

  const getExpandedView = () => {
    if (contextState.status == "completed")
      return (
        <div
          className="muted-text"
          style={{ marginTop: "4px", fontSize: "0.9rem", marginLeft: "24px" }}
        >
          {getAcknowledgedText()}
        </div>
      );
    if (contextState.error) return null;
    const alertDisplayText = getAlertDisplayText();
    return (
      <div className="input flex flex-start">
        <label className="checkbox-container" aria-label="review checkbox">
          {contextState.savingInProgress ? "Saving ... " : alertDisplayText}
          <input
            type="checkbox"
            aria-label="hidden checkbox"
            onClick={handleInputClick}
          />
          <span className="checkmark"></span>
        </label>
      </div>
    );
  };

  const renderError = () => {
    if (!contextState.error) return null;
    const errorStyle = {
      marginLeft: "24px",
      marginTop: "4px",
      fontWeight: "normal",
      fontSize: "0.95rem",
    };
    return (
      <div className="error" style={errorStyle}>
        {contextState.error}
      </div>
    );
  };

  if (!shouldShowAlert) return null;
  if (contextState.loading) {
    return <div className="banner alert-banner">Loading ...</div>;
  }

  const conditionalClass = contextState.expanded ? "" : "close";

  return (
    <div
      className={`banner alert-banner ${conditionalClass}`}
      role="presentation"
      onClick={handleCloseToggle}
      onKeyDown={handleCloseToggle}
    >
      <strong className="title flex flex-start flex-align-start">
        <FontAwesomeIcon icon={faExclamationCircle} title="notice" />
        {contextState.expanded && <span>{currentAlertProps.text}</span>}
        {!contextState.expanded && getFoldedView()}
      </strong>
      <ChevronDownIcon
        className="close-button"
        icon="times"
        title="close"
        width="25"
        height="25"
      />
      <div className="content">{getExpandedView()}</div>
      {renderError()}
    </div>
  );
}

AlertBanner.propTypes = {
  summaryData: PropTypes.array.isRequired,
  type: PropTypes.string.isRequired,
};
