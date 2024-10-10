import React, { Component } from "react";
import Table from "./Table";

export default class MedicationList extends Component {
  render() {
    return <Table data={this.props.medicationListData} {...this.props}></Table>;
  }
}
