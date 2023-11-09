import React from "react";

export default function LineIcon(props) {
  return (
    <img
      src={process.env.PUBLIC_URL + "/assets/images/line.png"}
      alt="same"
      width="15"
      {...props}
    />
  );
}
