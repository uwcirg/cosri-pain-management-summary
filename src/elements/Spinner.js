import React from 'react';

const Spinner = (props) => {
  return (
    <div>
      props.loadingMessage && {<div className="loading-message" dangerouslySetInnerHTML={{ __html: props.loadingMessage }}></div>}
      <div className="spinner" role="img" aria-label="Loading">
        <div className="bounce1"></div>
        <div className="bounce2"></div>
        <div className="bounce3"></div>
      </div>
    </div>
  );
}

export default Spinner;
