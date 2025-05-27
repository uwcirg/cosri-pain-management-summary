import { useEffect, useContext, useReducer } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ChevronDownIcon from "../../icons/ChevronDownIcon";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FhirClientContext } from "../../context/FhirClientContext";
import {
  addMonthsToDate,
  getUserIdFromAccessToken,
  isEmptyArray,
  noCacheHeader,
} from "../../helpers/utility";
import Debug from "./Debug";
import * as alertUtil from "./utility.js";

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
    // possible values : due, pending, completed
    status: null,
    dueDate: null,
    lastAcknowledgedDate: null,
    error: null,
  });

  const isDebugging = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return !!urlParams.get("debugging");
  };
  const dataToUse = isDebugging() ? alertUtil.getDebugMMEData() : summaryData;
  const alertType = type ? type : alertUtil.getAlertType(dataToUse);
  const currentAlertProps = alertUtil.alertProps[alertType];
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
        alertUtil.getCommunicationPayload(
          {
            ...dataParams,
            noteText: userId ? `user=${userId}` : "",
          },
          contextState.currentCommunicationRequest?.id
        )
      )
      .then((result) => {
        if (result && result.sent) {
          if (contextState.currentCommunicationRequest) {
            let payload = JSON.parse(
              JSON.stringify(contextState.currentCommunicationRequest)
            );
            payload.status = "completed";
            client.update(payload).catch((e) => {
              console.log(
                "Unable to mark CommunicationRequest as completed. ",
                e
              );
              contextStateDispatch({
                error: "Unable to complete saving. See console for detail.",
              });
            });
          }
          setTimeout(() => {
            contextStateDispatch({
              lastAcknowledgedDate: alertUtil.getDisplayDate(result.sent),
              savingInProgress: false,
              expanded: false,
              currentCommunication: result,
              status: "completed",
            });
          }, 350);
        } else {
          contextStateDispatch({
            error: "Unable to complete saving. No saving result.",
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
  };

  const shouldShowAlert = alertUtil.shouldDisplayAlert(alertType, dataToUse);

  useEffect(() => {
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
        const currentCommunication =
          alertUtil.getMostRecentCommunicationBySentFromBundle(commResults);
        const lastAcknowledgedDate = currentCommunication?.sent;
        const currentCommunicationRequest =
          alertUtil.getMostRecentCommunicationRequestByEndDateFromBundle(
            crResults,
            alertUtil.getReferencedCRIdsFromBundle(commResults)
          );
        const isNotDue = alertUtil.isNotDueYet(lastAcknowledgedDate);
        const crEndDate = alertUtil.getEndDateFromCommunicationRequest(
          currentCommunicationRequest
        );

        // acknowledged and alert not due yet
        if (isNotDue) {
          contextStateDispatch({
            loading: false,
            status: "completed",
            lastAcknowledgedDate: lastAcknowledgedDate,
            currentCommunication: currentCommunication,
            dueDate: crEndDate,
          });
          return;
        }

        const shouldCreateCR = !crEndDate || alertUtil.isOverDue(crEndDate);
        const currentStatus = alertUtil.isAboutDue(lastAcknowledgedDate)
          ? "pending"
          : "due";

        if (shouldCreateCR) {
          // existing CR expired, create new CR
          const crStartDate = alertUtil.isAboutDue(lastAcknowledgedDate)
            ? lastAcknowledgedDate
            : new Date().toISOString();
          const crEndDate = alertUtil.isAboutDue(lastAcknowledgedDate)
            ? addMonthsToDate(lastAcknowledgedDate, 12)
            : addMonthsToDate(null, 12);
          client
            .create(
              alertUtil.getCommunicationRequestPayload({
                ...dataParams,
                startDate: crStartDate,
                endDate: crEndDate,
                noteText: alertUtil.isAboutDue(lastAcknowledgedDate)
                  ? `Acknowlegement is due in 2 months. Last acknowledged on ${lastAcknowledgedDate}`
                  : alertUtil.isOverDue(lastAcknowledgedDate)
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
                    "Error occurred updating previous CommunicationRequest: ",
                    e
                  );
                });
              }
              contextStateDispatch({
                loading: false,
                status: currentStatus,
                expanded: shouldShowAlert,
                lastAcknowledgedDate: lastAcknowledgedDate,
                dueDate: alertUtil.getEndDateFromCommunicationRequest(result),
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
            status: currentStatus,
            expanded: shouldShowAlert,
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

  const renderAlertExpandedTitle = () => (
    <span>
      {contextState.status === "completed" &&
      currentAlertProps.expandedTitle_acknowledged
        ? currentAlertProps.expandedTitle_acknowledged
        : currentAlertProps.expandedTitle}
    </span>
  );

  const getAcknowledgedText = () => {
    if (!contextState.lastAcknowledgedDate) return "";
    const commNote = contextState.currentCommunication?.note;
    const noteText =
      commNote && !isEmptyArray(commNote)
        ? contextState.currentCommunication.note[0].text
        : "";
    //exampe: user=test
    const arrText = noteText.split("=");
    const acknowledgedDate = alertUtil.getDisplayDate(
      contextState.lastAcknowledgedDate
    );
    const acknowledgedUser = arrText[1] ? arrText[1] : "";
    return `last acknowledged on ${acknowledgedDate} ${
      acknowledgedUser ? " by " + acknowledgedUser : ""
    }`;
  };

  const getDueExpandedText = () => {
    const defaultText = "Please verify access and acknowledge this alert.";
    if (contextState.status === "pending") {
      if (!!currentAlertProps.expandedText_aboutdue) {
        return currentAlertProps.expandedText_aboutdue.replace(
          "{date}",
          alertUtil.getDisplayDate(contextState.dueDate)
        );
      }
      return currentAlertProps.expandedText_due ?? defaultText;
    }
    return currentAlertProps.expandedText_due ?? defaultText;
  };

  const getFoldedView = () => {
    const shouldShowAcknowledgement =
      contextState.status === "pending" || contextState.lastAcknowledgedDate;
    return (
      <div className="flex flex-start">
        <span>
          {currentAlertProps.foldedTitle ?? "Naloxone recommendation"}
        </span>
        {contextState.savingInProgress && (
          <span className="note">Saving ...</span>
        )}
        {!contextState.savingInProgress && shouldShowAcknowledgement && (
          <span className="note">{getAcknowledgedText()}</span>
        )}
        {!contextState.savingInProgress && !shouldShowAcknowledgement && (
          <span className="info-text">{currentAlertProps.foldedText}</span>
        )}
      </div>
    );
  };

  const getExpandedView = () => {
    if (contextState.status === "completed") {
      const displayText =
        currentAlertProps.expandedText_acknowledged ??
        "This alert should next be acknowledged after {date}.";
      return (
        <div className="side-note muted-text">
          {displayText.replace(
            "{date}",
            alertUtil.getDisplayDate(
              addMonthsToDate(contextState.lastAcknowledgedDate, 10)
            )
          )}
        </div>
      );
    }
    if (contextState.error) return null;
    const alertCheckboxText = getDueExpandedText();
    return (
      <div className="input flex flex-start">
        <label className="checkbox-container" aria-label="review checkbox">
          {contextState.savingInProgress ? "Saving ... " : alertCheckboxText}
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
    return <div className="error">{contextState.error}</div>;
  };

  if (contextState.loading) {
    return <div className="banner alert-banner">Loading ...</div>;
  }

  const expandedClass = contextState.expanded ? "" : "close";
  const alertClass = contextState.status === "completed" ? "info" : "";

  return (
    <>
      <div
        className={`banner alert-banner ${expandedClass} ${alertClass}`}
        role="presentation"
        onClick={handleCloseToggle}
        onKeyDown={handleCloseToggle}
      >
        <strong className="title flex flex-start flex-align-start">
          <FontAwesomeIcon icon={faExclamationCircle} title="notice" />
          {contextState.expanded && renderAlertExpandedTitle()}
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
      {!contextState.loading && (
        <Debug
          params={{
            client: client,
            patient: patient,
            userId: userId,
            dataParams: dataParams,
            currentCommunication: contextState.currentCommunication,
            currentCommunicationRequest:
              contextState.currentCommunicationRequest,
          }}
          summaryData={dataToUse}
        ></Debug>
      )}
    </>
  );
}

AlertBanner.propTypes = {
  summaryData: PropTypes.array.isRequired,
  type: PropTypes.string,
};
