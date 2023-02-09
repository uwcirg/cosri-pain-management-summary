import React from "react";
import styled from "styled-components";
import { useFlexLayout, useTable, useSortBy, usePagination } from "react-table";
import AscendingSortImg from "../icons/icon-sort-up.png";
import DescenidngSortImg from "../icons/icon-sort-down.png";

const Styles = styled.div`
  table {
    width: 100%;
    border-spacing: 0;
    th,
    td {
      margin: 0;
    }
  }

  .pagination {
    margin-top: 16px;
    padding: 8px 0 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    column-gap: 16px;
    input {
      height: 24px;
    }
    select {
      height: 32px;
    }
  }
  .button {
    background-color: transparent;
    border: 0;
    font-size: 1rem;
  }
`;

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
        sortBy: params.defaultSorted ? params.defaultSorted: [],
        pageSize: params.pageSize || 10,
      },
    },
    useSortBy,
    usePagination,
    useFlexLayout
  );

  // Render the UI for your table
  return (
    <Styles>
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
                    {column.isSorted && column.isSortedDesc && (
                      <img
                        src={AscendingSortImg}
                        alt="sort in ascending order"
                        width="8"
                        height="8"
                      />
                    )}
                    {column.isSorted && !column.isSortedDesc && (
                      <img
                        src={DescenidngSortImg}
                        alt="sort in descending order"
                        width="8"
                        height="8"
                      />
                    )}
                    {!column.isSorted && !column.disableSortBy && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          rowGap: "1px",
                          alignItems: "center",
                          position: "relative",
                          top: "-2px"
                        }}
                      >
                        <img
                          src={AscendingSortImg}
                          alt="sort in ascending order"
                          width="8"
                        />
                        <span> </span>
                        <img
                          src={DescenidngSortImg}
                          alt="sort in descending order"
                          width="8"
                        />
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
      {params.showPagination && (
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
      )}
    </Styles>
  );
}
