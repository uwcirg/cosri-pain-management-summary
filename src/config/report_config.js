import React from "react";
import UserIcon from "../icons/UserIcon";
import ChartIcon from "../icons/ChartIcon";
import BarsIcon from "../icons/BarsIcon";
import ListIcon from "../icons/ListIcon";
import PainIcon from "../icons/PainIcon";
import OverViewComponent from "../components/Report/components/Overview";
import ResponsesSummary from "../components/Report/components/ResponsesSummary";
import RankedResponses from "../components/Report/components/RankedResponses";
import Procedures from "../components/Report/components/Procedures";
import Referrals from "../components/Report/components/Referrals";
import MedicationList from "../components/Report/components/MedicationList";

const iconProps = {
  width: 35,
  height: 35,
  className: "sectionIcon",
};
export const BODY_DIAGRAM_DATA_KEY = "paintracker-location-body-diagram";
export const GE_DATA_KEY = "paintracker-ge";
export const PEG_DATA_KEY = "PEG";
export const PHQ9_DATA_KEY = "PHQ9";
export const GAD7_DATA_KEY = "GAD7";
export const PHQ4_DATA_KEY = "PHQ-4";
export const PCPTSD5_DATA_KEY = "PC-PTSD-5";
export const PROMISGLOBAL_DATA_KEY = "PROMIS-GLOBAL";
export const STOP_DATA_KEY = "PAINTRACKER-STOP";
export const TRT_DATA_KEY = "PAINTRACKER-TRT";
export const PROCECURE_DATA_KEY = "PROCEDURE_HISTORY";
export const REFERRAL_DATA_KEY = "REFERRAL_HISTORY";
export const MEDICATION_LIST_DATA_KEY = "MedicationList";

const reportConfig = [
  {
    title: "Overview",
    dataKey: "scoringOverview",
    questionnaires: [
      {
        id: "CIRG-PainTracker-Location-Body-Diagram",
        key: BODY_DIAGRAM_DATA_KEY,
      },
    ],
    icon: (props) => (
      <ChartIcon
        {...{
          width: 38,
          height: 38,
          className: "sectionIcon",
        }}
        {...props}
        title="Overview"
      />
    ),
    component: (props) => <OverViewComponent {...props}></OverViewComponent>,
  },
  {
    title: "Goals and Expectations",
    dataKey: "goalsExpectations",
    questionnaires: [
      {
        id: "CIRG-PainTracker-GE",
        key: GE_DATA_KEY,
      },
    ],
    //status: "inactive",
    icon: (props) => (
      <BarsIcon
        {...{
          width: 32,
          height: 32,
          className: "sectionIcon",
        }}
        {...props}
        title="Goals and Expectations"
      ></BarsIcon>
    ),
    sections: [
      {
        dataKey: GE_DATA_KEY,
        title: "Patient-reported Treatment Goals",
        component: (props) => <RankedResponses {...props}></RankedResponses>,
      },
    ],
  },
  {
    title: "Pain and Limitation",
    dataKey: "painLimitationSection",
    questionnaires: [
      {
        id: "CIRG-PEG",
        key: PEG_DATA_KEY,
      },
    ],
    icon: (props) => (
      <PainIcon {...iconProps} {...props} title="Pain and Limitation" />
    ),
    sections: [
      {
        dataKey: PEG_DATA_KEY,
        title:
          "PEG (Pain intensity, Enjoyment of life, General activity 3 item pain scale)",
        // default description, will be used description from questionnaire is not available
        description: () => (
          <div>
            <p>
              Pain intensity, Enjoyment of life, General activity (PEG) 3 item
              pain scale.
            </p>
            <p>
              Based primarily on{" "}
              <a
                href="https://fhir.loinc.org/Questionnaire/?url=http://loinc.org/q/91148-7"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://fhir.loinc.org/Questionnaire/?url=http://loinc.org/q/91148-7
              </a>{" "}
              and to a lesser extent{" "}
              <a
                href="https://loinc.org/91148-7/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://loinc.org/91148-7/{" "}
              </a>{" "}
              , using codes from the former.
            </p>
            <p>
              Note that these two references had different codes for the first
              question and that it was implemented at fhir.loinc.org as a
              decimal (not a choice), but academic references did not support
              that.
            </p>
            <p>
              The sum score, i.e. the CIRG-PEG-SUM item on the questionnaire, is
              a scoring variant used at UW Medicine's Center for Pain Relief.
            </p>
          </div>
        ),
        component: (props) => (
          <ResponsesSummary
            columns={[
              {
                key: "sum_score",
                description: "Sum Score",
              },
              {
                key: "mean_score",
                description: "Mean Score",
              },
              {
                key: "responses_completed",
                description: "Responses completed",
              },
              {
                key: "responses",
                description: "Responses",
                number: 2,
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
    questionnaires: [
      {
        id: "CIRG-PHQ9",
        key: PHQ9_DATA_KEY,
      },
      {
        id: "CIRG-GAD7",
        key: GAD7_DATA_KEY,
      },
      {
        id: "CIRG-PHQ-4",
        key: PHQ4_DATA_KEY,
      },
      {
        id: "CIRG-PC-PTSD-5",
        key: PCPTSD5_DATA_KEY,
      },
      {
        id: "CIRG-PROMIS-GLOBAL",
        key: PROMISGLOBAL_DATA_KEY,
      },
      {
        id: "CIRG-PainTracker-STOP",
        key: STOP_DATA_KEY,
      },
    ],
    icon: (props) => (
      <UserIcon
        {...iconProps}
        {...props}
        title="Mental Health, Quality of Life and Sleep"
      />
    ),
    sections: [
      {
        dataKey: PHQ9_DATA_KEY,
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
        dataKey: GAD7_DATA_KEY,
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
      {
        dataKey: PHQ4_DATA_KEY,
        title: "PHQ-4 (Patient Health Questionnaire 4 item)",
        description: () => (
          <div>
            <p>
              PHQ-4 Four-item Patient Health Questionnaire for Anxiety and
              Depression measures anxiety and depression symptoms.
            </p>
            <p>
              The PHQ-4 is different - although the total score (which ranges
              from 0-12) can be used, it is really a combination of the PHQ-2
              depression scale and the GAD-2 anxiety scale (from the parent
              GAD-7 anxiety scale). Thus, another way to look at it is a 0-6
              depression subscale and a 0-6 anxiety scale. It is clearly
              different than either the PHQ-9 or the PHQ-2.
            </p>
            <p>
              Total score is determined by adding together the scores of each of
              the 4 items.
            </p>
            <p>
              Scores are rated as normal (0-2), mild (3-5), moderate (6-8), and
              severe (9-12).
            </p>
            <p>Total score ≥ 3 for first 2 questions suggests anxiety.</p>
            <p>Total score ≥ 3 for last 2 questions suggests depression.</p>
          </div>
        ),
        component: (props) => <ResponsesSummary {...props}></ResponsesSummary>,
      },
      {
        dataKey: PCPTSD5_DATA_KEY,
        title: "PC-PTSD-5 (Primary Care PTSD Screen for DSM-5)",
        description: () => (
          <div>
            <p>
              The Primary Care PTSD Screen for DSM-5 (PC-PTSD-5) is a 5-item
              screen that was designed to identify individuals with probable
              PTSD in primary care settings. The measure begins with an item
              which assesses lifetime exposure to traumatic events. If a
              respondent denies exposure, the PC-PTSD-5 is complete with a score
              of 0. However, if a respondent indicates that they have had any
              lifetime exposure to trauma, the respondent is instructed to
              respond to 5 additional yes/no questions about how that trauma
              exposure has affected them over the past month.
            </p>
          </div>
        ),
        component: (props) => <ResponsesSummary {...props}></ResponsesSummary>,
      },
      {
        dataKey: "PROMIS-GLOBAL",
        title: "PROMIS short form - global",
        description: () => (
          <div>
            <p>
              The PROMIS Global Health form is a carefully standardized
              psychometric instrument which measures the individuals global
              health.
            </p>
          </div>
        ),
        component: (props) => <ResponsesSummary {...props}></ResponsesSummary>,
      },
      {
        dataKey: STOP_DATA_KEY,
        title: "STOP Questionnaire: Screen for Obstructive Sleep Apnea",
        description: () => (
          <div>
            <p>
              STOP Questionnaire: A Tool to Screen Patients for Obstructive
              Sleep Apnea.
            </p>
            <p>
              See{" "}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://pubs.asahq.org/anesthesiology/article/108/5/812/8377/STOP-QuestionnaireA-Tool-to-Screen-Patients-for"
              >
                reference
              </a>
            </p>
          </div>
        ),
        component: (props) => <ResponsesSummary {...props}></ResponsesSummary>,
      },
    ],
  },
  {
    title: "Treatment History",
    dataKey: "treatmentHistorySection",
    questionnaires: [
      {
        id: "CIRG-PainTracker-TRT",
        key: TRT_DATA_KEY,
      },
    ],
    icon: (props) => (
      <ListIcon {...iconProps} {...props} title="Treatment History" />
    ),
    sections: [
      {
        dataKey: REFERRAL_DATA_KEY,
        title: "Referrals",
        component: (props) => (
          <Referrals
            tableOptions={{
              id: `${REFERRAL_DATA_KEY}_table`,
              headers: {
                Date: {
                  key: "DateText",
                  formatter: "datishFormat",
                  sorter: "dateCompare",
                  sortable: true,
                },
                Name: "Name",
                "CPT Code": "CPT_CODE",
              },
            }}
            {...props}
          ></Referrals>
        ),
      },
      {
        dataKey: PROCECURE_DATA_KEY,
        title: "Procedures",
        component: (props) => (
          <Procedures
            tableOptions={{
              id: `${PROCECURE_DATA_KEY}_table`,
              headers: {
                Date: {
                  key: "DateText",
                  formatter: "datishFormat",
                  sorter: "dateCompare",
                  sortable: true,
                },
                Name: "Name",
                "CPT Code": "CPT_CODE",
              },
            }}
            {...props}
          ></Procedures>
        ),
      },
      {
        dataKey: MEDICATION_LIST_DATA_KEY,
        dataKeySource: "ReportSummary",
        title: "Medications",
        flags: [
          {
            parentKey: "PDMPMedications",
            dataKey: "PDMPMedications"
          }
        ],
        component: (props) => (
          <MedicationList
            tableOptions={{
              id: `${MEDICATION_LIST_DATA_KEY}_table`,
              headers: {
                Drug_Description: "Name",
                Dosage: "Dosage",
                Written_Date: {
                  key: "Start",
                  formatter: "datishFormat",
                  sorter: "dateCompare",
                  sortable: true,
                },
                Prescriber: "Prescriber"
              },
            }}
            {...props}
          ></MedicationList>
        ),
      },
      {
        dataKey: TRT_DATA_KEY,
        title: "Patient-reported Treatments Questionnaire",
        description: () => (
          <div>
            <p>
              PainTracker TRT questionnaire surveys, to the best of the
              patient's recollection, how many different healthcare providers
              the patient has seen in the <b>LAST 6 MONTHS</b> for pain.
            </p>
          </div>
        ),
        component: (props) => (
          <ResponsesSummary
            columns={[
              {
                key: "responses_completed",
                description: "Responses completed",
              },
              {
                key: "responses",
                description: "Responses",
              },
            ]}
            includeQuestionHeaders={true}
            {...props}
          ></ResponsesSummary>
        ),
      },
    ],
  },
];
export default reportConfig;
