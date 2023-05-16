import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import { isNumber } from "../../helpers/utility";

export default class Score extends Component {
  render() {
    const { score, scoreParams, cssClass } = this.props;
    const scoreSeverity = scoreParams
      ? String(scoreParams.scoreSeverity).toLowerCase()
      : null;
    const arrColoredSeverities = ["high", "moderately high", "moderate"];
    const arrModerateSeverities = ["moderate", "moderately high"];
    const iconClass =
      scoreSeverity === "high"
        ? "text-alert"
        : arrModerateSeverities.indexOf(scoreSeverity) !== -1
        ? "text-warning"
        : "";
    if (!score || !isNumber(score)) return "--";
    if (arrColoredSeverities.indexOf(scoreSeverity) !== -1)
      return (
        <div className={`flex flex-space-between ${cssClass}`}>
          <span className={iconClass}>{score}</span>
          <FontAwesomeIcon
            className={iconClass}
            icon="exclamation-circle"
            tabIndex={0}
          />
        </div>
      );
    return <div className={`flex ${cssClass}`}>{score}</div>;
  }
}

Score.propTypes = {
  score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  scoreParams: PropTypes.object,
  cssClass: PropTypes.string
};
