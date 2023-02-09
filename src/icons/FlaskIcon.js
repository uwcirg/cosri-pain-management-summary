import React from "react";

export default function FlaskIcon(props) {
  return (
    //source https://www.svgrepo.com/svg/155021/test-tube
    <img
      className="sectionIcon"
      src={process.env.PUBLIC_URL + "/assets/images/flask.svg"}
      alt="flask icon"
      width="25"
      height="25"
    />
  );
}
