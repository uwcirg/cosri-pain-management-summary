import { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { dateFormat } from "../../helpers/formatit";
import { addMonthsToDate, getEnvSystemType } from "../../helpers/utility";
import * as alertUtil from "./utility.js";

const Debug = ({ summaryData, params, display }) => {
  let keysPressed = {};
  const currentMME = alertUtil.getCurrentMME(summaryData);
  const parentRef = useRef();
  const mmeInputRef = useRef();
  const mmePastInputRef = useRef();
  const dateInputRef = useRef();
  const resetButtonRef = useRef();
  const {
    client,
    patient,
    userId,
    dataParams,
    currentCommunication,
    currentCommunicationRequest,
  } = params;
  const [show, setShow] = useState(display);
  const handleInputClick = () => {
    setShow(!show);
  };
  const renderMMEInputView = () => {
    return (
      <div className="small">
        <div style={{ marginBottom: "8px" }}>
          Current MME value:{" "}
          <strong
            className={`${currentMME >= 50 ? "text-warning" : "text-success"}`}
          >{`${currentMME}`}</strong>
        </div>
        <div className="small flex flex-start flex-gap-1">
          <div>
            <div>
              Change current MME value to{" "}
              <input
                type="number"
                aria-label="MME value"
                style={{ width: "40px" }}
                min={0}
                defaultValue={0}
                ref={mmeInputRef}
              ></input>
            </div>
            {renderPastMMEView()}
          </div>
          <button
            className="button-default button-outlined button-small"
            style={{ alignSelf: "stretch" }}
            onClick={() => {
              if (
                mmeInputRef.current.value === "" &&
                parseInt(mmeInputRef.current.value) !== 0
              ) {
                return false;
              }
              window.location =
                window.location.origin +
                "?debugging=true&mmeValue=" +
                mmeInputRef.current.value +
                (mmePastInputRef.current.checked ? "&mmeInPast=true" : "");
            }}
          >
            Update
          </button>
        </div>
      </div>
    );
  };
  const renderPastMMEView = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mmeInPast = urlParams.get("mmeInPast");
    return (
      <div className="small">
        {" "}
        <label
          className="checkbox-container small"
          aria-label="has MME in past checkbox"
        >
          Has MME in last 2 years?
          <input
            type="checkbox"
            aria-label="hidden checkbox"
            defaultChecked={!!mmeInPast}
            ref={mmePastInputRef}
          />
          <span className="checkmark"></span>
        </label>
      </div>
    );
  };
  const renderResetDateView = () => {
    return (
      <div className="small flex flex-start" style={{ marginTop: "20px" }}>
        Reset acknowledged date to{" "}
        <input
          ref={dateInputRef}
          type="date"
          placeholder="YYYY-MM-DD"
          aria-label="acknowledged date input field"
          maxLength={10}
          max={dateFormat("", new Date(), "YYYY-MM-DD")}
          style={{ minWidth: "104px" }}
          onKeyUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        ></input>
        <button
          className="button-default button-outlined button-small"
          onClick={(e) => {
            e.stopPropagation();
            const inputVal = dateInputRef.current.value;
            if (!inputVal) return false;
            alertUtil
              .resetComms(
                client,
                patient?.id,
                {
                  ...dataParams,
                  sentDate: inputVal,
                  startDate: inputVal,
                  endDate: addMonthsToDate(inputVal, 12),
                  noteText: "user=" + (userId ? userId : "test"),
                  status: "completed",
                },
                currentCommunicationRequest?.id,
                currentCommunication?.id
              )
              .then((results) => {
                if (results) {
                  e.target.innerText = "Done. Reloading...";
                  setTimeout(
                    () =>
                      (window.location =
                        window.location.origin +
                        "?debugging=true&mmeValue=" +
                        currentMME),
                    350
                  );
                  return;
                }
                e.target.innerText = "Update";
              })
              .catch((e) => {
                // e.target.innerText = "Update";
                alert(e);
              });
          }}
        >
          Update
        </button>
      </div>
    );
  };
  const renderResetAllView = () => {
    return (
      <div
        className="flex flex-start small radio-container"
        style={{ marginTop: "12px" }}
      >
        <button
          className="button-default button-outlined button-small"
          ref={resetButtonRef}
          onClick={(e) => {
            const btnElement = resetButtonRef.current;
            let originalText = "";
            if (btnElement) {
              originalText = btnElement.innerText;
              btnElement.innerText = "Please wait....";
            }
            alertUtil
              .removeAllResources(client, patient?.id)
              .then(() => {
                if (btnElement) btnElement.innerText = "Done. Reloading...";
                setTimeout(
                  () => (window.location = window.location.origin),
                  350
                );
              })
              .catch((e) => {
                if (btnElement) btnElement.innerText = originalText;
                alert(e);
              });
          }}
          aria-label="delete all button"
        >
          {" "}
          Reset All{" "}
        </button>
        <span className="small">
          (This will clear all Communication & CommunicationRequest resources
          for this patient)
        </span>
      </div>
    );
  };

  const handleKeyDown = (event) => {
    event.preventDefault;
    keysPressed[event.key.toLowerCase()] = true;
    if (keysPressed["control"] && keysPressed["shift"] && keysPressed["a"]) {
      parentRef.current.style.display = "block";
    }
    if (keysPressed["control"] && keysPressed["shift"] && keysPressed["h"]) {
      parentRef.current.style.display = "none";
    }
  };

  const handleKeyUp = (event) => {
    event.preventDefault;
    delete keysPressed[event.key.toLowerCase()];
  };

  const removeEventListeners = () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => removeEventListeners();
  }, []);

  if (getEnvSystemType() !== "development") return null;
  return (
    <div
      className="flex flex-align-start"
      style={{
        padding: "8px 24px",
        borderTop: "1px solid #ececec",
      }}
      ref={parentRef}
    >
      {show && (
        <div style={{ marginBottom: "16px" }}>
          <h4 style={{ marginTop: "8px" }}>
            FOR TESTING ( development only ){" "}
          </h4>
          {renderMMEInputView()}
          {currentCommunication && renderResetDateView()}
          <br />
          <hr />
          {renderResetAllView()}
        </div>
      )}
      <div className="flex-align-start flex-column">
        <div className="input flex flex-end">
          <label
            className="checkbox-container"
            aria-label="show debugger checkbox"
          >
            Test Naloxone alert?
            <input
              type="checkbox"
              aria-label="hidden checkbox"
              defaultChecked={show}
              onChange={handleInputClick}
            />
            <span className="checkmark"></span>
          </label>
        </div>
        <div
          className="flex flex-end text-muted x-small"
          style={{ marginTop: "12px" }}
        >
          Ctrl + Shift + H to hide testing
        </div>
      </div>
    </div>
  );
};

export default Debug;

Debug.propTypes = {
  params: PropTypes.object,
  summaryData: PropTypes.array,
};
