import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import { isNumber } from "../../helpers/utility";

export default class Score extends Component {
  render() {
    const { score, scoreParams } = this.props;
    const scoreSeverity = scoreParams
      ? String(scoreParams.scoreSeverity).toLowerCase()
      : null;
    const coloredSeverities = ["high", "moderately high", "moderate"];
    const iconClass =
      scoreSeverity === "high"
        ? "text-alert"
        : (scoreSeverity === "moderate" || scoreSeverity === "moderately high")
        ? "text-warning"
        : "";
    if (!isNumber(score)) return "--";
    if (coloredSeverities.indexOf(scoreSeverity) !== -1)
      return (
        <div className="flex flex-start">
          <span className={iconClass}>{score}</span>
          <FontAwesomeIcon
            className={iconClass}
            icon="exclamation-circle"
            tabIndex={0}
          />
        </div>
      );
    return score;
  }
}

Score.propTypes = {
  score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  scoreParams: PropTypes.object,
};
