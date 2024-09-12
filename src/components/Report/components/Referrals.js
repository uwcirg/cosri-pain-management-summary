import React, { Component } from "react";
import Table from "./Table";

export default class Procedures extends Component {
  render() {
    return <Table data={this.props.referralData} {...this.props}></Table>;
  }
}