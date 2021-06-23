import React from 'react';

const Version = (props) => {
  return (
    <div class='version__display'>
        <span class="version__display__title">Version Number:</span><span class="version__display__version__string">{props.versionString}</span>
    </div>
  );
}

export default Version;
