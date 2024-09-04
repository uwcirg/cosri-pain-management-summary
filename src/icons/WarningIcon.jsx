import React from "react";
export default function WarningIcon(props) {
  return (
    <img
      src={"/assets/images/warningExclamation.png"}
      alt={props.alt?props.alt:"warning"}
      title={props.title?props.title:""}
      {...props}
    />
  );
}
