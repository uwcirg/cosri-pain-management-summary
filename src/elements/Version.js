import React from 'react';

const Version = (props) => {
  return (
    <div className='version__display'>
        <span className="version__display__title">Version Number:</span><span className="version__display__version__string">{props.versionString}</span>
    </div>
  );
}

export default Version;
