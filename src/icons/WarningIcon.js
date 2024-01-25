import React from "react";
export default function WarningIcon(props) {
  return (
    <img
      src={process.env.PUBLIC_URL + "/assets/images/warningExclamation.png"}
      alt={props.alt?props.alt:"warning"}
      {...props}
    />
  );
}
