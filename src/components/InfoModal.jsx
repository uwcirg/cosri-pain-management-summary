import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark, faLink } from "@fortawesome/free-solid-svg-icons";
import Table from "./Table";

export default class InfoModal extends Component {
  constructor() {
    super(...arguments);

    this.elementsTableProps = { id: "react__elements__table" };
    this.referencesTableProps = { id: "react__references__table" };
  }

  renderElements = (elements) => {
    const tableElements = elements.elements;
    const columns = [
      {
        Header: () => <span className="col-header">Name</span>,
        accessor: "name",
        minWidth: "45%",
        disableSortBy: true,
      },
      {
        Header: () => <span className="col-header">Status</span>,
        accessor: "status",
        disableSortBy: true,
      },
      {
        Header: () => <span className="col-header">Lookback</span>,
        accessor: "lookback",
        disableSortBy: true,
      },
    ];
    return (
      <div
        className="element"
        role="table"
        aria-label={elements.description}
        aria-describedby={this.elementsTableProps.id}
      >
        <h4>{elements.description}</h4>
        <Table
          //className="elements__table"
          columns={columns}
          data={tableElements}
          tableParams={{
            minRows: 1,
            showPagination: false,
            resizable: false,
            getProps: () => this.elementsTableProps,
          }}
        />
      </div>
    );
  };

  renderReferences = (references) => {
    const columns = [
      {
        Header: () => <span className="col-header">Link</span>,
        accessor: "urlLink",
        maxWidth: 50,
        disableSortBy: true,
      },
      {
        Header: () => <span className="col-header">Title</span>,
        accessor: "title",
        disableSortBy: true,
      },
      {
        Header: () => <span className="col-header">Details</span>,
        accessor: "details",
        disableSortBy: true,
      },
    ];

    let data = references;
    data.forEach((reference) => {
      reference.urlLink = (
        <a
          href={reference.url}
          src={reference.title}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faLink} title="link" />
        </a>
      );
    });

    return (
      <div
        className="reference"
        role="table"
        aria-label="References"
        aria-describedby={this.referencesTableProps.id}
      >
        <Table
          className="elements__table"
          columns={columns}
          data={data}
          tableParams={{
            minRows: 1,
            showPagination: false,
            resizable: false,
            getProps: () => this.referencesTableProps,
          }}
        />
      </div>
    );
  };
  
  renderDescription(description) {
    return (
      <div
        className="description"
        dangerouslySetInnerHTML={{__html: description}}></div>
    );
  }

  render() {
    const { subSection, closeModal } = this.props;
    const elements = subSection.info ? subSection.info.find(
      (el) => el.type === "elements"
    ) : null;
    const references = subSection.info ? subSection.info.filter(
      (el) => el.type === "reference"
    ) : null;
    const description = subSection.description;

    return (
      <div className="info-modal">
        <div className="info-modal__header">
          More Information for {subSection.name}
          <FontAwesomeIcon
            icon={faCircleXmark}
            title="close"
            className="close-icon"
            onClick={closeModal}
          />
        </div>

        <div className="info-modal__body">
          {elements != null && (
            <div className="elements">{this.renderElements(elements)}</div>
          )}

          {(references && references.length > 0) &&
            <div className="references">
              <h4>References:</h4>
              {this.renderReferences(references)}
            </div>
          }
          {description && this.renderDescription(description)}
        </div>
      </div>
    );
  }
}

InfoModal.propTypes = {
  subSection: PropTypes.object,
  closeModal: PropTypes.func.isRequired,
};
