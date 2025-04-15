import React from "react";
import { useTable, useSortBy, usePagination } from "react-table";
import AscendingSortImg from "../icons/icon-sort-up.png";
import DescenidngSortImg from "../icons/icon-sort-down.png";

export default function Table({
  tableKey,
  columns,
  data,
  tableParams,
  tableClass,
}) {
  const tableAnchorRef = React.createRef();
  const params = tableParams ? tableParams : {};
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
        sortBy: params.defaultSorted ? params.defaultSorted : [],
        pageSize: params.pageSize || 10,
      },
    },
    useSortBy,
    usePagination
    // useFlexLayout
  );

  const toTop = () =>
    tableAnchorRef.current?.scrollIntoView({
      behavior: "instant",
      block: "start",
    });

  const renderPagination = () => (
    <div className="pagination">
      <div className="buttons-container">
        <button
          className="button"
          onClick={() => {
            gotoPage(0);
            toTop();
          }}
          disabled={!canPreviousPage}
        >
          {"<<"}
        </button>
        <button
          className="button"
          onClick={(e) => {
            previousPage(e);
            toTop();
          }}
          disabled={!canPreviousPage}
        >
          {"<"}
        </button>
        <button
          className="button"
          onClick={(e) => {
            nextPage(e);
            toTop();
          }}
          disabled={!canNextPage}
        >
          {">"}
        </button>
        <button
          className="button"
          onClick={() => {
            gotoPage(pageCount - 1);
            toTop();
          }}
          disabled={!canNextPage}
        >
          {">>"}
        </button>
      </div>
      <div>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[5, 10, 20, 50, 100].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>{" "}
        rows per page
      </div>
      <div>
        <span>
          page <strong>{pageIndex + 1}</strong> of {pageOptions.length}
        </span>
      </div>
    </div>
  );
  const renderAscSortIcon = () => (
    <img
      src={AscendingSortImg}
      alt="sort in ascending order"
      width="6"
      height="6"
    />
  );
  const renderDescSortIcon = () => (
    <img
      src={DescenidngSortImg}
      alt="sort in descending order"
      width="6"
      height="6"
    />
  );
  const emptyRows =
    pageIndex > 0 ? Math.max(0, (1 + pageIndex) * pageSize - page.length) : 0;

  // Render the UI for your table
  return (
    <div>
      <div
        style={{ position: "relative", top: -160, height: 1, fontSize: "0.1rem" }}
        ref={tableAnchorRef}
      >
        &nbsp;
      </div>
      <table
        className={`ReactTable ${
          tableClass ? tableClass : columns.length <= 2 ? "single-column" : ""
        }`}
        {...getTableProps()}
        {...(params.tableProps ? params.tableProps : {})}
        key={tableKey}
      >
        <thead>
          {headerGroups.map((headerGroup, headerIndex) => (
            <tr
              {...headerGroup.getHeaderGroupProps()}
              key={`row_${tableKey}_${headerIndex}`}
            >
              {headerGroup.headers.map((column, colIndex) => {
                const headerProps = column.getHeaderProps(
                  column.getSortByToggleProps()
                );
                const cellMinWidth = column.minWidth ? column.minWidth : "auto";
                const cellWidth = column.width ? `${column.width}` : "160px";
                return (
                  <th
                    {...headerProps}
                    style={{
                      ...headerProps.style,
                      width: cellWidth,
                      minWidth: cellMinWidth,
                    }}
                    key={`th_${tableKey}_${colIndex}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      {column.render("Header")}{" "}
                      {column.isSorted && column.isSortedDesc && (
                        <div style={{ position: "relative", top: "-2px" }}>
                          {renderDescSortIcon()}
                        </div>
                      )}
                      {column.isSorted && !column.isSortedDesc && (
                        <div style={{ position: "relative", top: "-2px" }}>
                          {renderAscSortIcon()}
                        </div>
                      )}
                      {!column.isSorted && !column.disableSortBy && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            rowGap: "1px",
                            alignItems: "center",
                            position: "relative",
                            top: "-2px",
                          }}
                        >
                          {renderAscSortIcon()}
                          {renderDescSortIcon()}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()} key={`tbody_${tableKey}`}>
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={`tr_${tableKey}_${i}`}>
                {row.cells.map((cell, cellIndex) => {
                  const cellProps = cell.getCellProps();
                  const cellMinWidth = cell.column.minWidth
                    ? cell.column.minWidth
                    : "auto";
                  const cellWidth = cell.column.width
                    ? `${cell.column.width}`
                    : "160px";
                  return (
                    <td
                      {...cellProps}
                      className={
                        cell.column.className ? cell.column.className : ""
                      }
                      key={`td_${tableKey}_${cellIndex}`}
                      style={{
                        ...cellProps.style,
                        width: cellWidth,
                        minWidth: cellMinWidth,
                      }}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {emptyRows > 0 && (
            <tr className="no-hover">
              {page[0].cells.map((cell, cellIndex) => {
                const cellProps = cell.getCellProps();
                const cellMinWidth = cell.column.minWidth
                  ? cell.column.minWidth
                  : "auto";
                const cellWidth = cell.column.width
                  ? `${cell.column.width}`
                  : "160px";
                return (
                  <td
                    {...cellProps}
                    className={
                      cell.column.className ? cell.column.className : ""
                    }
                    key={`td_${tableKey}_filler_${cellIndex}`}
                    style={{
                      ...cellProps.style,
                      width: cellWidth,
                      minWidth: cellMinWidth,
                      height: 24 * emptyRows,
                    }}
                  >
                    &nbsp;
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
      {/* 
        pagination
      */}
      {params.showPagination && renderPagination()}
    </div>
  );
}
