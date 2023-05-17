import React from "react";
import UserIcon from "../icons/UserIcon";
import ChartIcon from "../icons/ChartIcon";
import MedicalHistoryIcon from "../icons/MedicalHistoryIcon";
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
    title: "Pain and Limitation",
    dataKey: "painLimitationSection",
    questionnaires: ["peg", "body diagram"],
    icon: (props) => (
      <MedicalHistoryIcon
        {...iconProps}
        {...props}
        title="Pain and Limitation"
      />
    ),
    sections: [
      {
        name: "PEG",
        dataKey: "peg",
        title:
          "Pain intensity, Enjoyment of life, General activity (PEG) 3 item pain scale",
        description: () => (
          <div>
            <p>
              Pain intensity, Enjoyment of life, General activity (PEG) 3 item
              pain scale.
            </p>
            <p>
              Based on both{" "}
              <a
                href="https://fhir.loinc.org/Questionnaire/?url=http://loinc.org/q/91148-7"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://fhir.loinc.org/Questionnaire/?url=http://loinc.org/q/91148-7
              </a>{" "}
              and{" "}
              <a
                href="https://loinc.org/91148-7/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://loinc.org/91148-7/{" "}
              </a>{" "}
              (not FHIR), conserving and harmonizing codes from those.
            </p>
            <p>
              Note that these two had different codes for the first question,
              and that it was implemented in the loinc FHIR as a decimal (not a
              choice), but academic references did not support that, so the
              decision here was to implement a choice with novel codes.
            </p>
          </div>
        ),
        component: (props) => (
          <ResponsesSummary
            columns={[
              {
                key: "score",
                description: "Mean Score",
              },
              {
                key: "sum_score",
                description: "Sum Score",
              },
              {
                key: "responses_completed",
                description: "Responses completed",
              },
              {
                key: "responses",
                description: "Responses",
              },
            ]}
            {...props}
          ></ResponsesSummary>
        ),
      },
    ],
  },
  {
    title: "Mental Health, Quality of Life and Sleep",
    dataKey: "mentalHealthSection",
    questionnaires: ["phq", "gad7"],
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
