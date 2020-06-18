import React, { Component } from 'react';

class UserInfo extends Component {

  constructor(props) {
    super(props);
    this.state = {
      name: "",
      email: ""
    };
    if (this.props.authProvider) {
        this.props.authProvider.loadUserInfo().then(userInfo => {
            this.setState({name: userInfo.name, email: userInfo.email})
        });
    }
  }

  render() {
    return (
      <div className="user-info">
        <div className="title">Login as</div>
        <div className="item">{this.state.name}</div>
        <div className="item">{this.state.email}</div>
      </div>
    );
  }
}
export default UserInfo;
