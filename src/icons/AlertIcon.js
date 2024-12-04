import React from "react";
export default function AlertIcon(props) {
  return (
    <img
      src={process.env.PUBLIC_URL + "/assets/images/alertExclamation.png"}
      alt={props.alt?props.alt:"alert"}
      title={props.title?props.title:""}
      {...props}
    />
  );
}
