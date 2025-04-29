import React from 'react';
import Axis from './axis';
const XYAxis = (settings) => {
  return (
    <g className="axis-group">
      <Axis {...settings.xSettings} />
      <Axis {...settings.ySettings} />
    </g>
  );
};

export default XYAxis;
