import React, { useEffect, useContext, useReducer } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ChevronDownIcon from "../icons/ChevronDownIcon";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FhirClientContext } from "../context/FhirClientContext";
import {
  isEmptyArray,
  getDiffMonths,
  getDateObjectInLocalDateTime,
} from "../helpers/utility";
import { extractDateFromGMTDateString } from "../helpers/formatit";

export default function NaloxoneAlert({ summaryData }) {
  const context = useContext(FhirClientContext);
  const { client, patient } = context;
  const loinCode = "HZ85ZZZ";
  const getPostFHIRData = () => ({
    date: extractDateFromGMTDateString(new Date().toISOString()),
    resourceType: "DocumentReference",
    subject: {
      reference: `Patient/${patient?.id}`,
    },
    type: {
      coding: [
        {
          code: loinCode,
          display:
            "Medication Management for Substance Abuse Treatment, Naloxone",
          system: "https://loinc.org",
        },
      ],
    },
  });
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
    display:
      !isEmptyArray(summaryData) &&
      summaryData.find((item) => item.MMEValue > 0),
    viewedDate: null,
    // loading: true,
    loading: false
  });
  const handleClose = (e) => {
    e.stopPropagation();
    contextStateDispatch({ display: false });
  };

  const handleCloseToggle = (e) => {
    if (e) e.preventDefault();
    contextStateDispatch({
      display: !display,
    });
  };

  const handleInputClick = (e) => {
    if (e) e.stopPropagation();
    client.create(getPostFHIRData()).then((result) => {
      if (result && result.date) {
        contextStateDispatch({
          viewedDate: result.date,
        });
      }
    });
  };

  // useEffect(() => {
  //   if (!client || !patient || !contextState.loading) return;
  //   client
  //     .request(
  //       `DocumentReference?patient=${patient.id}&_count=300&_sort=-_lastUpdated`
  //     )
  //     .then((results) => {
  //       if (!results || isEmptyArray(results.entry)) return;
  //       const match = results.entry.find(
  //         (item) => item.resource.type.coding[0].code === loinCode
  //       );
  //       const lastDate = match.resource.date;
  //       const numMonth = getDiffMonths(
  //         new Date(),
  //         getDateObjectInLocalDateTime(lastDate)
  //       );
  //       console.log("numb ", numMonth)
  //       contextStateDispatch({
  //         viewedDate: lastDate && numMonth <= 12 ? lastDate : null,
  //         loading: false,
  //       });
  //     })
  //     .catch((e) =>
  //       contextStateDispatch({
  //         loading: false,
  //       })
  //     );
  // }, [client, patient]);

  //if (contextState.viewedDate) return null;
  if (!contextState.display) return null;
  if (contextState.loading)
    return <div className="banner alert-banner">Loading alert data...</div>;

  const conditionalClass = contextState.display ? "" : "close";
  return (
    <div
      className={`banner alert-banner ${conditionalClass}`}
      role="presentation"
      style={{
        paddingTop: "8px",
        marginTop: "2px"
      }}
      // onClick={handleCloseToggle}
      // onKeyDown={handleCloseToggle}
    >
      <strong className="title">
        <FontAwesomeIcon icon={faExclamationCircle} title="notice" /> Naloxone
        is recommended for every patient receiving opioids, please review that
        patient has naloxone.
      </strong>
      {/* <ChevronDownIcon
        className="close-button"
        icon="times"
        title="close"
        width="25"
        height="25"
      /> */}
      {contextState.viewedDate && (
        <div
          className="muted-text"
          style={{ marginTop: "4px", fontSize: "0.8em", marginLeft: "24px" }}
        >{`Reviewed on ${contextState.viewedDate}`}</div>
      )}
      {!contextState.viewedDate && (
        <div className="input flex flex-start">
          <input
            type="checkbox"
            aria-label="review checkbox"
            onClick={handleInputClick}
            checked={contextState.viewedDate}
            disabled={contextState.viewedDate}
          ></input>
          <span>Check here if you have reviewed.</span>
        </div>
      )}
    </div>
  );
}
