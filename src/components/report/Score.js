import React, { Component } from "react";
import PropTypes from "prop-types";
import AlertIcon from "../../icons/AlertIcon";
import WarningIcon from "../../icons/WarningIcon";
import { isNumber } from "../../helpers/utility";

export default class Score extends Component {
  render() {
    const { score, scoreParams, cssClass } = this.props;
    const scoreSeverity = scoreParams
      ? String(scoreParams.scoreSeverity).toLowerCase()
      : null;
    const arrColoredSeverities = ["high", "moderately high", "moderate"];
    const arrModerateSeverities = ["moderate", "moderately high"];
    const highSeverity = scoreSeverity === "high";
    const moderateSeverity =
      arrModerateSeverities.indexOf(scoreSeverity) !== -1;
    const iconClass = highSeverity
      ? "text-alert"
      : moderateSeverity
      ? "text-warning"
      : "";
    if (!score || !isNumber(score)) return "--";
    if (arrColoredSeverities.indexOf(scoreSeverity) !== -1)
      return (
        <div className={`flex flex-space-between ${cssClass}`}>
          <span className={iconClass}>{score}</span>
          {highSeverity && !moderateSeverity && (
              <AlertIcon />
          )}
          {moderateSeverity && (
              <WarningIcon />
          )}
        </div>
      );
    return <div className={`flex ${cssClass}`}>{score}</div>;
  }
}

Score.propTypes = {
  score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  scoreParams: PropTypes.object,
  cssClass: PropTypes.string,
};
