export const PRIMARY_COLOR = "#168698";
export const defaultLineAttributes = {
  strokeColor: PRIMARY_COLOR,
  strokeFill: PRIMARY_COLOR,
  strokeWidth: 2.25,
  dataPoints: {
    dataStrokeWidth: 4,
    dataStrokeFill: PRIMARY_COLOR,
    strokeWidth: 4,
    radiusWidth: 2,
  },
};

export const COLORS = [
  "#304ffe",
  "#827717",
  "#3f51b5",
  "#fb8c00",
  "#673ab7",
  "#4a148c",
  "#880e4f",
  "#B404AE",
  "#2196f3",
  "#6200ea",
  "#009688",
  "#00bcd4",
  "#004d40",
  "#9e9d24",
  "#ff9800",
  "#ffeb3b",
  "#795548",
  "#607d8b",
  "#006064",
  "#ff8a80",
  "#c0ca33",
  "#757575",
  "#455a64",
];

export function getLineAttributes(id, params, colorIndex) {
  const lineParams = params ? params : {};
  let color = PRIMARY_COLOR;
  if (!isNaN(colorIndex) && COLORS[colorIndex]) color = COLORS[colorIndex];
  return {
    id: `${id}_line`,
    strokeColor: color,
    strokeFill: color,
    strokeWidth: lineParams.strokeWidth ? lineParams.strokeWidth : 2.25,
    dataPoints: {
      id: `${id}_data`,
      strokeWidth: lineParams.dataStrokeWidth
        ? lineParams.dataStrokeWidth
        : 4,
      strokeFill: color,
      strokeColor: color,
      radiusWidth: 2,
    },
  };
}

