import React from 'react';
import {getEnv} from "../utils/envConfig";

const Version = () => {
  const versionString = getEnv("REACT_APP_VERSION_STRING");
  if (!versionString) return null;
  return (
    <div className="version__display">
      <span className="version__display__title">Version Number:</span>
      <span className="version__display__version__string">{versionString}</span>
    </div>
  );
}

export default Version;
