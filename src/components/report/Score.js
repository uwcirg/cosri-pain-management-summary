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
    if (!isNumber(score)) return "--";
    if (scoreSeverity === "high")
      return (
        <div className="flex flex-start">
          <span className="text-alert">{score}</span>
          <FontAwesomeIcon
            className="text-alert"
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
