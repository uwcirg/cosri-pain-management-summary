import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactTable from "react-table";
import * as formatit from "../../../helpers/formatit";
import * as sortit from "../../../helpers/sortit";
import { isEmptyArray } from "../../../helpers/utility";
import CopyButton from "../../CopyButton";
import DefaultTable from "../../Table";

export default class Table extends Component {
  constructor() {
    super(...arguments);
    this.tableRef = React.createRef();
  }
  renderTable(tableOptions = {}, entries) {
    // If a filter is provided, only render those things that have the filter field (or don't have it when it's negated)
    let filteredEntries = entries;
    if (!isEmptyArray(tableOptions.filter)) {
      // A filter starting with '!' is negated (looking for absence of that field)
      const negated = tableOptions.filter[0] === "!";
      const filter = negated
        ? tableOptions.filter.substring(1)
        : tableOptions.filter;
      filteredEntries = entries.filter((e) =>
        negated ? e[filter] == null : e[filter] != null
      );
    }
    if (isEmptyArray(filteredEntries)) return null;

    //ReactTable needs an ID for aria-describedby
    let tableID = `${tableOptions.id}_tableContainer`;

    const headers = Object.keys(tableOptions.headers);
    let columns = [];
    headers.forEach((header) => {
      const headerKey = tableOptions.headers[header];
      const headerClass = headerKey.className ? headerKey.className : "";
      const column = {
        id: header,
        Header: () => {
          if (headerKey.omitHeader) return "";
          if (headerKey.header)
            return <h3 className="col-header-title">{header}</h3>;
          return (
            <span className={`col-header col-${header} ${headerClass}`}>
              {header}
            </span>
          );
        },
        accessor: (entry) => {
          let value = entry[headerKey];
          if (headerKey.formatter) {
            const { result } = this.props;
            let formatterArguments = headerKey.formatterArguments || [];
            value = formatit[headerKey.formatter](
              result,
              entry[headerKey.key],
              ...formatterArguments
            );
          }
          return value
            ? value
            : headerKey.default
            ? headerKey.default
            : entry[headerKey.key];
        },
        disableSortBy: headerKey.sortable ? false : true,
      };

      let columnFormatter = headerKey.formatter;
      if (column.canSort) {
        if (headerKey.sorter) {
          if (sortit[headerKey.sorter]) {
            column.sortType = (rowA, rowB, columnId) =>
              sortit[headerKey.sorter](rowA[columnId], rowB[columnId]);
          }
        } else if (columnFormatter) {
          const sortObj = {
            dateTimeFormat: sortit.dateTimeCompare,
            dateFormat: sortit.dateCompare,
            dateAgeFormat: sortit.dateCompare,
            datishFormat: sortit.datishCompare,
            datishAgeFormat: sortit.datishCompare,
            ageFormat: sortit.ageCompare,
            quantityFormat: sortit.quantityCompare,
          };
          if (sortObj[columnFormatter])
            column.sortType = (rowA, rowB, columnId) =>
              sortObj[columnFormatter](rowA[columnId], rowB[columnId]);
        }
      }

      if (headerKey.minWidth != null) {
        column.minWidth = headerKey.minWidth;
      }

      if (headerKey.maxWidth != null) {
        column.maxWidth = headerKey.maxWidth;
      }

      columns.push(column);
    });

    let customProps = { id: tableID };
    let defaultSorted = [];
    if (tableOptions.defaultSorted) {
      defaultSorted.push(tableOptions.defaultSorted);
    }
    //getTheadThProps solution courtesy of:
    //https://spectrum.chat/react-table/general/is-there-a-way-to-activate-sort-via-onkeypress~66656e87-7f5c-4767-8b23-ddf35d73f8af
    return (
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", right: "12px", top: "4px"}}>
          <CopyButton
            buttonTitle="Click to copy"
            elementToCopy={this.getElementToCopy()}
          ></CopyButton>
        </div>
        <div
          key={tableID}
          className="table"
          role="table"
          aria-label={`table ${tableID}`}
          aria-describedby={customProps.id}
          ref={this.tableRef}
        >
          <DefaultTable
            tableKey={tableID}
            columns={columns}
            data={filteredEntries}
            tableClass="wide"
            tableParams={{
              defaultSorted: defaultSorted,
              pageSize: 10,
              showPagination: filteredEntries.length > 10,
              tableProps: customProps,
            }}
          ></DefaultTable>
        </div>
      </div>
    );
  }

  getElementToCopy() {
    if (!this.tableRef.current) return null;
    const tableEl = this.tableRef.current.querySelector(".rt-table");
    if (tableEl) return tableEl;
    return this.tableRef.current;
  }

  render() {
    const { tableOptions, data } = this.props;
    if (isEmptyArray(data))
      return <div className="no-entries">No entry found</div>;
    return this.renderTable(tableOptions, data);
  }
}

Table.propTypes = {
  data: PropTypes.array,
  tableOptions: PropTypes.object,
};
