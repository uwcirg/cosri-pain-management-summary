import React, { Component } from "react";
import PropTypes from "prop-types";

import FhirQuery from "./FhirQuery";

export default class DevTools extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      displayDevTools: false,
      displayFhirQueries: false,
      displayCQLResults: false,
      displayPDMPResults: false,
      displayGraphResults: false,
      displayOtherResults: false,
    };
  }

  toggleDevTools = (event) => {
    event.preventDefault();
    this.setState({ displayDevTools: !this.state.displayDevTools });
  };

  toggleFhirQueries = (event) => {
    event.preventDefault();
    this.setState({ displayFhirQueries: !this.state.displayFhirQueries });
  };

  toggleCQLResults = (event) => {
    event.preventDefault();
    this.setState({ displayCQLResults: !this.state.displayCQLResults });
  };

  togglePDMPResults = (event) => {
    event.preventDefault();
    this.setState({ displayPDMPResults: !this.state.displayPDMPResults });
  };

  toggleGraphResults = (event) => {
    event.preventDefault();
    this.setState({ displayGraphResults: !this.state.displayGraphResults });
  };

  toggleOtherResults = (event) => {
    event.preventDefault();
    this.setState({ displayOtherResults: !this.state.displayOtherResults });
  };

  errorMessage(er, i) {
    return (
      <tr key={i}>
        <td>{er.type || er.url}</td>
        <td>
          {er.error.message ||
            er.error.statusText ||
            (typeof er.error === "string" && er.error) ||
            "No error message provided"}
        </td>
      </tr>
    );
  }

  renderErrors() {
    const errResponses = this.props.collector.filter((i) => i.error);

    if (errResponses.length) {
      return (
        <div className="cql-errors">
          <h4>{errResponses.length} Errors</h4>

          <table id="cql-errors" border="1" width="100%">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Error</th>
              </tr>
            </thead>

            <tbody>
              {errResponses.map((er, i) => this.errorMessage(er, i))}
            </tbody>
          </table>
        </div>
      );
    }

    return <div></div>;
  }

  renderFHIRQueries() {
    return (
      <div className="fhir-queries">
        <h4>
          FHIR Queries{" "}
          <span className="small">(from confidential backend)</span>{" "}
          <button onClick={this.toggleFhirQueries}>[show/hide]</button>
        </h4>
        <div
          style={{ display: this.state.displayFhirQueries ? "block" : "none" }}
        >
          {this.props.collector.map((item, i) => {
            const url =
              i === 0
                ? item.url
                : item.url.slice(item.url.lastIndexOf("/") + 1);
            return <FhirQuery key={i} url={url} data={item.data} />;
          })}
        </div>
      </div>
    );
  }

  renderCQLResults() {
    return (
      <div className="cql-results">
        <h4>
          CQL Results{" "}
          <button onClick={this.toggleCQLResults}>[show/hide]</button>
        </h4>

        <div
          style={{ display: this.state.displayCQLResults ? "block" : "none" }}
        >
          <pre>{JSON.stringify(this.props.summary, null, 2)}</pre>
        </div>
      </div>
    );
  }

  renderPDMPResults() {
    let pdmpDataset = this.props.summary.PDMPMedications
      ? this.props.summary.PDMPMedications
      : null;
    return (
      <div className="pdmp-results">
        <h4>
          PDMP CQL Results{" "}
          <button onClick={this.togglePDMPResults}>[show/hide]</button>
        </h4>
        <div
          style={{ display: this.state.displayPDMPResults ? "block" : "none" }}
        >
          <pre>
            {pdmpDataset ? JSON.stringify(pdmpDataset, null, 2) : "No result"}
          </pre>
        </div>
      </div>
    );
  }
  renderGraphResults() {
    let graphDataSet = this.props.graphData ? this.props.graphData : null;
    // console.log("graph data ", graphDataSet);
    if (!graphDataSet) return null;
    const keys = Object.keys(graphDataSet);
    if (!keys.length) return null;
    return (
      <div className="graph-results">
        <h4>
          Graph Data{" "}
          <button onClick={this.toggleGraphResults}>[show/hide]</button>
        </h4>
        <div
          style={{ display: this.state.displayGraphResults ? "block" : "none" }}
        >
          {keys.map((key, index) => {
            return (
              <div key={`${key}_table_${index}`}>
                {graphDataSet[key].title && (
                  <h5 className="title">{graphDataSet[key].title}</h5>
                )}
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>MME Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graphDataSet[key].data.map((o, index) => (
                      <tr key={`${key}_row_${index}`}>
                        <td>{o["date"]}</td>
                        <td>{o["MMEValue"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  renderOtherResults() {
    return (
      <div className="other-results">
        <h4>
          Other Results{" "}
          <button onClick={this.toggleOtherResults}>[show/hide]</button>
        </h4>

        <div
          style={{ display: this.state.displayOtherResults ? "block" : "none" }}
        >
          <pre>{JSON.stringify(this.props.other, null, 2)}</pre>
        </div>
      </div>
    );
  }

  render() {
    if (!this.props.collector) {
      return null;
    }

    return (
      <div className="dev-tools">
        <h3 className="title js-toc-ignore">
          Development Tools{" "}
          <button className="button-link" onClick={this.toggleDevTools}>
            [show/hide]
          </button>
        </h3>

        <div className="dev-tools__disclaimer">
          These development tools are for troubleshooting issues and intended to
          be used by technical support.
        </div>

        <div style={{ display: this.state.displayDevTools ? "block" : "none" }}>
          {this.renderErrors()}
          {this.renderFHIRQueries()}
          {this.renderCQLResults()}
          {this.renderPDMPResults()}
          {this.renderGraphResults()}
          {this.renderOtherResults()}
        </div>
      </div>
    );
  }
}

DevTools.propTypes = {
  collector: PropTypes.array.isRequired,
  summary: PropTypes.object.isRequired,
  graphData: PropTypes.object,
  other: PropTypes.object,
};
