import React from "react";
import UserIcon from "../icons/UserIcon";
import ChartIcon from "../icons/ChartIcon";
import OverViewComponent from "../components/report/Overview";
import ResponsesSummary from "../components/report/ResponsesSummary";

const iconProps = {
  width: 35,
  height: 35,
  className: "sectionIcon",
};
const reportConfig = [
  {
    title: "Scoring Overview",
    dataKey: "scoringOverview",
    icon: (props) => (
      <ChartIcon {...iconProps} {...props} title="Score Overview" />
    ),
    component: (props) => <OverViewComponent {...props}></OverViewComponent>,
  },
  {
    title: "Mental Health, Quality of Life and Sleep",
    dataKey: "mentalHealthSection",
    icon: (props) => (
      <UserIcon
        {...iconProps}
        {...props}
        title="Mental Health, Quality of Life and Sleep"
      />
    ),
    sections: [
      {
        name: "PHQ9",
        dataKey: "phq9",
        title: "PHQ-9 (Patient Health Questionnaire-9)",
        description: () => (
          <div>
            <p>
              PHQ-9 measures depression symptoms. A clinical diagnosis of
              depression should be confirmed by a clinician. Any positive
              response to suicidal ideation should be followed up immediately by
              a healthcare professional.
            </p>
            <p>
              Depression is often associated with and can manifest as physical
              pain. Depression can also exacerbate physical pain. Treating
              depression may help to mitigate pain.
            </p>
            <p>PHQ-9 scores and association with levels of depression:</p>
            <table cellSpacing="8">
              <tr>
                <td>0</td>
                <td>No depression</td>
              </tr>
              <tr>
                <td>1-4</td>
                <td>Minimal depression</td>
              </tr>
              <tr>
                <td>5-9</td>
                <td>Mild depression</td>
              </tr>
              <tr>
                <td>10-14</td>
                <td>Moderate depression</td>
              </tr>
              <tr>
                <td>15-19</td>
                <td>Moderately severe depression</td>
              </tr>
              <tr>
                <td>20-27</td>
                <td>Severe depression</td>
              </tr>
            </table>
          </div>
        ),
        component: (props) => <ResponsesSummary {...props}></ResponsesSummary>,
      },
      {
        name: "GAD7",
        dataKey: "gad7",
        title: "GAD-7 (General Anxiety Disorder-7)",
        description: () => (
          <div>
            <p>
              The <b>Generalized Anxiety Disorder Assessment</b> (GAD-7) is a
              seven-item instrument that is used to measure or assess the
              severity of generalized anxiety disorder (GAD). Each item asks the
              individual to rate the severity of his or her symptoms over the
              past two weeks.
            </p>
            <p>GAD-7 scores and association with levels of anxiety:</p>
            <table cellSpacing="8">
              <tr>
                <td>0-4</td>
                <td>Minimal anxiety</td>
              </tr>
              <tr>
                <td>5-9</td>
                <td>Mild anxiety</td>
              </tr>
              <tr>
                <td>10-14</td>
                <td>Moderate anxiety</td>
              </tr>
              <tr>
                <td>15-21</td>
                <td>Severe anxiety</td>
              </tr>
            </table>
          </div>
        ),
        component: (props) => <ResponsesSummary {...props}></ResponsesSummary>,
      },
    ],
  },
];
export default reportConfig;
