import React from "react";
import { useFlexLayout, useTable, useSortBy, usePagination } from "react-table";
import AscendingSortImg from "../icons/icon-sort-up.png";
import DescenidngSortImg from "../icons/icon-sort-down.png";

export default function Table({ columns, data, tableParams }) {
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
    usePagination,
    useFlexLayout
  );

  const renderPagination = () => (
    <div className="pagination">
      <div className="buttons-container">
        <button
          className="button"
          onClick={() => gotoPage(0)}
          disabled={!canPreviousPage}
        >
          {"<<"}
        </button>{" "}
        <button
          className="button"
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
        >
          {"<"}
        </button>{" "}
        <button
          className="button"
          onClick={() => nextPage()}
          disabled={!canNextPage}
        >
          {">"}
        </button>{" "}
        <button
          className="button"
          onClick={() => gotoPage(pageCount - 1)}
          disabled={!canNextPage}
        >
          {">>"}
        </button>{" "}
      </div>
      <div>
        <span>
          page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
      </div>
      <div>
        <span>
          go to page:{" "}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: "50px", border: "2px solid #ececec" }}
          />
        </span>{" "}
      </div>
      <select
        value={pageSize}
        onChange={(e) => {
          setPageSize(Number(e.target.value));
        }}
        style={{
          border: "2px solid #ececec",
        }}
      >
        {[10, 20, 50, 100].map((pageSize) => (
          <option key={pageSize} value={pageSize}>
            Show {pageSize}
          </option>
        ))}
      </select>
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
  // Render the UI for your table
  return (
    <div>
      <table
        className={`ReactTable ${columns.length <= 2 ? "single-column" : ""}`}
        {...getTableProps()}
      >
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    {column.render("Header")}{" "}
                    {column.isSorted &&
                      column.isSortedDesc &&
                      <div style={{position: "relative", top: "-2px"}}>{renderDescSortIcon()}</div>}
                    {column.isSorted &&
                      !column.isSortedDesc &&
                      <div style={{position: "relative", top: "-2px"}}>{renderAscSortIcon()}</div>}
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
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* 
        pagination
      */}
      {params.showPagination && renderPagination()}
    </div>
  );
}
