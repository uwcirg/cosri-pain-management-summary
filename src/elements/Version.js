import React from 'react';
import {getEnvVersionString} from "../helpers/utility";

const Version = () => {
  const versionString = getEnvVersionString();
  if (!versionString) return null;
  return (
    <div className="version__display">
      <span className="version__display__title">Version Number:</span>
      <span className="version__display__version__string">{versionString}</span>
    </div>
  );
}

export default Version;
