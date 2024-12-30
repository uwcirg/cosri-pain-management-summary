import React from "react";
import ReactTooltip from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const messageElement = (props) => {
  function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  }
  const uuid = uuidv4();

  return (
    <div className="print-hidden">
        <FontAwesomeIcon
        className="text-muted"
        icon="copy"
        style={{color: "#a5a7a8", marginRight: "4px"}}
      />
      <FontAwesomeIcon
        className="text-warning"
        icon="exclamation-triangle"
        data-for={`copyWarningTooltip_${uuid}`}
        data-tip
      />
      <ReactTooltip
        className="summary-tooltip"
        id={`copyWarningTooltip_${uuid}`}
        aria-haspopup="true"
      >
        <p>
          {props.message
            ? props.message
            : "If you want to copy this item, please try a different browser."}
          <br />
          This browser does not support copying via ClipboardItem API.
        </p>
      </ReactTooltip>
    </div>
  );
};
export default messageElement;
