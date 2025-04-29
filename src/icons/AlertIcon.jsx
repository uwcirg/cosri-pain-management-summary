import React from "react";
export default function AlertIcon(props) {
  return (
    <img
      src={"/assets/images/alertExclamation.png"}
      alt={props.alt?props.alt:"alert"}
      title={props.title?props.title:""}
      {...props}
    />
  );
}
