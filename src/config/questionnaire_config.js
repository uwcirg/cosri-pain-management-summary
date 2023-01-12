const PRIMARY_COLOR = "#168698";
const ORANGE_COLOR = "orange";
const BLUE_COLOR = "blue";
const defaults = {
  strokeColor: PRIMARY_COLOR,
  strokeFill: PRIMARY_COLOR,
  strokeWidth: "2.25",
  dataPoints: {
    dataStrokeWidth: "4",
    dataStrokeFill: PRIMARY_COLOR,
    strokeColor: PRIMARY_COLOR,
    strokeFill: PRIMARY_COLOR,
    strokeWidth: "4",
    radiusWidth: "2",
  },
};
const qConfig = {
  gad7: {
    graph: {
      ...defaults,
      strokeColor: BLUE_COLOR,
      strokeFill: BLUE_COLOR,
      dataPoints: {
        ...defaults["dataPoints"],
        id: "gad7_data",
        dataStrokeFill: BLUE_COLOR,
        strokeColor: BLUE_COLOR,
        strokeFill: BLUE_COLOR,
      },
    },
  },
  phq9: {
    graph: {
      ...defaults,
      strokeColor: ORANGE_COLOR,
      strokeFill: ORANGE_COLOR,
      dataPoints: {
        ...defaults["dataPoints"],
        id: "phq9_data",
        dataStrokeFill: ORANGE_COLOR,
        strokeColor: ORANGE_COLOR,
        strokeFill: ORANGE_COLOR,
      },
    },
  },
};
export default qConfig;
