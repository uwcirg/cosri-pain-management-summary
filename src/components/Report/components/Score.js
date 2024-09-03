import React, { Component } from "react";
import PropTypes from "prop-types";
import AlertIcon from "../../../icons/AlertIcon";
import WarningIcon from "../../../icons/WarningIcon";
import { isNumber } from "../../../helpers/utility";

export default class Score extends Component {
  render() {
    if (!isNumber(this.props.score)) return "--";

    const { cssClass, score, scoreParams } = this.props;
    const scoreSeverity =
      scoreParams && scoreParams.scoreSeverity
        ? String(scoreParams.scoreSeverity).toLowerCase()
        : null;
    const HIGH_SEVERITY = "high";
    const MODERATE_HIGH_SEVERITY = "moderately high";
    const MODERATE_SEVERITY = "moderate";
    const arrColoredSeverities = [
      HIGH_SEVERITY,
      MODERATE_HIGH_SEVERITY,
      MODERATE_SEVERITY,
    ];
    const arrModerateSeverities = [MODERATE_SEVERITY, MODERATE_HIGH_SEVERITY];
    const highSeverity = scoreSeverity === HIGH_SEVERITY;
    const moderateSeverity =
      arrModerateSeverities.indexOf(scoreSeverity) !== -1;
    const iconClass = highSeverity
      ? "text-alert"
      : moderateSeverity
      ? "text-warning"
      : "";
    if (arrColoredSeverities.indexOf(scoreSeverity) !== -1)
      return (
        <div className={`flex flex-space-between ${cssClass}`}>
          <span className={iconClass}>{score}</span>
          {highSeverity && !moderateSeverity && (
            <AlertIcon alt="high severity" title="high severity" />
          )}
          {moderateSeverity && (
            <WarningIcon alt="moderate severity" title="moderate severity" />
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
