import * as d3 from "d3";
export const PRIMARY_COLOR = "#168698";
export const defaultLineAttributes = {
  strokeColor: PRIMARY_COLOR,
  strokeFill: PRIMARY_COLOR,
  strokeWidth: 2.25,
  dataPointsProps: {
    dataStrokeWidth: 4,
    dataStrokeFill: PRIMARY_COLOR,
    strokeWidth: 4,
    radiusWidth: 2,
  },
};

export const siteMMEGraphAttributes = {
  "WA": {
    color: "#a75454",
    maxYValue: 120,
    text: "WA State: Consultation threshold"
  }
};

export const COLORS = [
  "#78281F",
  "#a387dd",
  "#e65100",
  "#5E9CBC",
  "#BC5EA6",
  "#304ffe",
  "#3f51b5",
  "#673ab7",
  "#D68C72",
  "#880e4f",
  "#B404AE",
  "#2196f3",
  "#fb8c00",
  "#6200ea",
  "#009688",
  "#880e4f",
  "#96008B",
  "#9e9d24",
  "#ff9800",
  "#ffeb3b",
  "#795548",
  "#607d8b",
  "#006064",
  "#ff8a80",
  "#00bcd4",
  "#757575",
  "#455a64",
  "#c0ca33",
  "#B633CA",
  "#33AACA",
];

export const MARKER_TYPES = [
  "circle",
  "square",
  "diamond",
  "wye",
  "cross",
  "star",
  "triangle",
];

export const MARKER_SHAPES = {
  "square": d3.symbolSquare,
  "circle": d3.symbolCircle,
  "wye": d3.symbolWye,
  "diamond": d3.symbolDiamond,
  "triangle": d3.symbolTriangle,
  "cross": d3.symbolCross,
  "star": d3.symbolStar,
  //others as needed
}
export function getLineAttributes(id, params, index) {
  const lineParams = params ? params : {};
  let color = PRIMARY_COLOR;
  if (!isNaN(index) && COLORS[index]) color = COLORS[index];
  let markerType = "circle";
  if (MARKER_TYPES[index]) markerType = MARKER_TYPES[index];
  return {
    id: `${id}_line`,
    strokeColor: color,
    markerType: markerType,
    markerSize: lineParams.markerSize ? lineParams.markerSize : 38,
    strokeWidth: lineParams.strokeWidth ? lineParams.strokeWidth : 2.25,
    dataPointsProps: {
      id: `${id}`,
      strokeWidth: lineParams.dataStrokeWidth ? lineParams.dataStrokeWidth : 1,
      fillColor: color,
      strokeColor: color,
    },
  };
}
