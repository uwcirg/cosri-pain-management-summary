import React, { Component } from "react";
import {
  allowCopyClipboardItem,
  // writeHTMLToClipboard,
  writeTextToClipboard,
} from "../../helpers/utility";

export default class CopyPaste extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      contentHTML: this.getDefaultContent(),
      hasScoreSummary: false,
    };
    this.contentAreaRef = React.createRef();
    this.copyContent = this.copyContent.bind(this);
    this.importScoreSummaryContent = this.importScoreSummaryContent.bind(this);
    this.handleGetScoreSummary = this.handleGetScoreSummary.bind(this);
    this.handleContentChange = this.handleContentChange.bind(this);
    this.clear = this.clear.bind(this);
  }
  componentDidMount() {
    this.contentAreaRef.current.innerHTML = this.state.contentHTML;
  }

  handleContentChange() {
    this.setState({
      contentHTML: this.contentAreaRef.current.innerHTML,
      previousContent: "",
    });
  }

  handleGetScoreSummary(e) {
    this.setState(
      {
        hasScoreSummary: !this.state.hasScoreSummary,
      },
      () => {
        if (this.state.hasScoreSummary) {
          this.importScoreSummaryContent();
          return;
        }
        this.setState(
          {
            contentHTML: this.getDefaultContent(),
          },
          () => {
            this.contentAreaRef.current.value = this.state.contentHTML;
          }
        );
        // const tempNode = this.contentAreaRef.current.cloneNode(true);
        // console.log("temp node? ", tempNode);
        // const originalElement = tempNode.querySelector(".original");
        // console.log("original ", originalElement);
        // this.setState(
        //   {
        //     contentHTML: originalElement.innerHTML,
        //   },
        //   () => {
        //     this.contentAreaRef.current.innerHTML = this.state.contentHTML;
        //   }
        // );
      }
    );
  }

  clear() {
    this.setState(
      {
        contentHTML: this.getDefaultContent(),
        hasScoreSummary: false,
      },
      () => {
        this.contentAreaRef.current.innerHTML = this.state.contentHTML;
      }
    );
  }

  copyContent() {
    if (!allowCopyClipboardItem()) {
      alert("ClipboardItem API not supported by this browser");
      return false;
    }
    writeTextToClipboard(this.state.contentHTML)
      .then(() => {
        alert("Content copied to clipboard");
      })
      .catch((e) => alert("Unable to copy content to clipboard"));
    // writeHTMLToClipboard(this.state.contentHTML)
    //   .then(() => {
    //     alert("Content copied to clipboard");
    //   })
    //   .catch((e) => alert("Unable to copy content to clipboard"));
  }

  getDefaultContent() {
    const patientInfo = this.props.patientInfo;
    return patientInfo ? patientInfo.Name : "";
  }

  importScoreSummaryContent() {
    let copyText = "";
    const scorePanelElement = document.querySelector(".score-panel");
    const scoreSummaryNode = scorePanelElement
      ? scorePanelElement.cloneNode(true)
      : null;
    if (scoreSummaryNode) {
      scoreSummaryNode.querySelectorAll("a").forEach((anchorElement) => {
        const span = document.createElement("span");
        span.innerText = anchorElement.innerText;
        anchorElement.replaceWith(span);
      });
      scoreSummaryNode.querySelectorAll("img").forEach((imageElement) => {
        const span = document.createElement("span");
        span.innerText = ` (${imageElement.getAttribute("alt")}) `;
        imageElement.replaceWith(span);
      });
      const tableElement = scoreSummaryNode.querySelector("table");
     
      if (tableElement) {
        copyText += "\r\n";
        const rows = tableElement.querySelectorAll("tr");
        const arrLengths = [];
        rows.forEach((r) => {
          const rCells = r.querySelectorAll("th, td");
          rCells.forEach((cell, cIndex) => {
            if (cIndex === 0) {
              arrLengths.push(cell.textContent?.length ?? 0);
            }
          });
        });
        console.log("arr Lengths ", arrLengths);
        const maxLength = Math.max(...arrLengths);

        const headerCells = tableElement.querySelectorAll("th");
        headerCells.forEach((cell, index) => {
          const delimiter =
            cell.textContent?.length >= maxLength
              ? " | "
              : [...Array(maxLength - cell.textContent?.length).keys()]
                  .map((item) => " ")
                  .join("") + " | ";
            copyText +=
            cell.innerText +
            (index < headerCells.length - 1 ? delimiter : "");
        });

        copyText += "\r\n" + [...Array(copyText.length)].map(() => "-").join("") + "\r\n";
       // copyText += ([...headerCells].map(h => h.textContent.length)).map(c => Array(c).keys().map(() => "--").join("")).join("");
        rows.forEach((row, rindex) => {
          const cells = row.querySelectorAll("td");
          //   const arrCells = [...cells].map(cell=> cell.innerText?.length??0);
          //  console.log("arrCells ", arrCells)
          //    const maxLength = Math.max(...arrCells);
          //   console.log("max length ", maxLength);
          cells.forEach((cell, index) => {
            const delimiter =
              cell.innerText?.length >= maxLength
                ? " | "
                : [...Array(maxLength - cell.innerText?.length).keys()]
                    .map((item) => " ")
                    .join("") + " | ";
            //const delimiter = "  |  ";
            copyText +=
              cell.innerText + (index < cells.length - 1 ? delimiter : "");
          });
          if (rindex !== 0) copyText += "\r\n";
        });
      }
      writeTextToClipboard(copyText).then((text) => {
        this.setState(
          {
            contentHTML: this.getDefaultContent() + "\r\n" + copyText,
          },
          () => {
            this.contentAreaRef.current.value = this.state.contentHTML;
          }
        );
      });
    }

    // const scorePanelElement = document.querySelector(".score-panel");
    // const scoreSummaryNode = scorePanelElement
    //   ? scorePanelElement.cloneNode(true)
    //   : null;
    // if (scoreSummaryNode) {
    //   const tableElement = scoreSummaryNode.querySelector("table");
    //   if (tableElement) {
    //     tableElement.style.fontFamily = "Ariel, sans-serif";
    //     tableElement.setAttribute("width", "100%");
    //   }
    //   scoreSummaryNode.querySelector("h3").style.fontSize = "20px";
    //   scoreSummaryNode.querySelectorAll("a").forEach((anchorElement) => {
    //     const span = document.createElement("span");
    //     span.innerText = anchorElement.innerText;
    //     anchorElement.replaceWith(span);
    //   });
    //   scoreSummaryNode.querySelectorAll("img").forEach((imageElement) => {
    //     const span = document.createElement("span");
    //     span.innerText = ` (${imageElement.getAttribute("alt")}) `;
    //     imageElement.replaceWith(span);
    //   });
    //   scoreSummaryNode.querySelectorAll("td, th").forEach((cellElement) => {
    //     cellElement.style.padding = "8px";
    //   });
    //   this.setState(
    //     {
    //       contentHTML:
    //         "<div style='font-family: ariel, sans-serif'>" +
    //         "<div class='original'>" +
    //         this.state.contentHTML +
    //         "</div>" +
    //         "<div class='score-summary-content'>" +
    //         "<br/><br/>" +
    //         scoreSummaryNode.outerHTML +
    //         "</div>" +
    //         "</div>",
    //     },
    //     () => {
    //       this.contentAreaRef.current.innerHTML = this.state.contentHTML;
    //     }
    //   );
    // }
  }
  renderInstruction() {
    const listItemStyle = {
      lineHeight: 1.5,
      "&:marker": {
        color: "#217684",
        fontSize: "1.5rem",
      },
    };
    return (
      <div>
        <ul
          style={{
            marginBlockEnd: 0,
            paddingLeft: "16px",
            paddingRight: "16px",
          }}
        >
          <li style={listItemStyle}>
            To copy the usual way: Highlight the content in the box area.
            Right-click the highlighted content and select "Copy" from the popup
            menu to copy content to clipboard.
          </li>
          <li style={listItemStyle}>
            OR click the "Copy box area content to clipboard" button below to
            copy content in the box area to clipboard.
          </li>
        </ul>
      </div>
    );
  }
  renderImportScoreSummaryCheckbox() {
    return (
      <div style={{ textAlign: "right", flex: 1 }}>
        <label>
          <input
            type="checkbox"
            onChange={this.handleGetScoreSummary}
            checked={this.state.hasScoreSummary}
            style={{
              marginRight: "8px",
            }}
          ></input>
          Add scoring summary table content to box area
        </label>
      </div>
    );
  }
  renderButtonsGroup() {
    const buttonStyle = {
      width: "320px",
      fontWeight: 600,
      borderRadius: "25vmax",
      lineHeight: 1.5,
      fontSize: "1rem",
    };
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          //  gap: "16px",
          flexWrap: "wrap",
          // marginTop: "8px",
          // marginBottom: "16px",
          flex: 1,
        }}
      >
        <button
          className="button-primary"
          style={buttonStyle}
          onClick={this.copyContent}
          disabled={!allowCopyClipboardItem()}
        >
          Copy box area content to clipboard
        </button>
        {/*** 
        <button
          className="button-default"
          onClick={this.clear}
          style={buttonStyle}
        >
          Clear box area content
        </button>
        */}
      </div>
    );
  }

  render() {
    const containerStyle = {
      height: "calc(100vh - 174px)",
      padding: "8px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      backgroundColor: "#f4f3f3",
    };
    const boxAreaStyle = {
      // height: "65%",
      flex: 1,
      padding: "16px",
      border: "2px solid",
      overflow: "auto",
      backgroundColor: "#FFF",
      width: "98%",
      margin: "auto",
      position: "relative",
      // whiteSpace: "pre",
    };
    return (
      <React.Fragment>
        <div style={containerStyle}>
          {this.renderInstruction()}
          {/* <div
            ref={this.contentAreaRef}
            contentEditable="true"
            style={boxAreaStyle}
            onBlur={this.handleContentChange}
          ></div> */}
          <textarea
            ref={this.contentAreaRef}
            style={boxAreaStyle}
            onBlur={this.handleContentChange}
          ></textarea>
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              {this.renderButtonsGroup()}
              {this.renderImportScoreSummaryCheckbox()}
            </div>
            {/* {!allowCopyClipboardItem() && (
              <p style={{ color: "#a81010" }}>
                HEY, you are using a browser that does not support Copy action via
                ClipboardItem API here. Please see{" "}
                <a href="https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem">
                  here
                </a>{" "}
                for more information.
              </p>
            )} */}
          </div>
        </div>
      </React.Fragment>
    );
  }
}
