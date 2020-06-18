import React, { Component } from 'react';

class Logout extends Component {

  logout() {
    if (this.props.authProvider) {
        this.props.authProvider.logout();
        window.location = "https://keycloak-dev.cirg.washington.edu/auth/realms/cosri-launcher/protocol/openid-connect/logout?redirect_uri=" + window.location.href;
    }
  }

  render() {
    return (
      <button className="btn-primary" onClick={ () => this.logout() }>
        Logout
      </button>
    );
  }
}
export default Logout;