import React, { Component } from "react";
import Table from "./Table";

export default class Procedures extends Component {
  render() {
    return <Table data={this.props.procedureData} {...this.props}></Table>;
  }
}
