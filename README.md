# "COSRI" Clinical Opioid Summary with Rx Integration, is based on the "AHRQ Pain Management Summary SMART on FHIR Application"

The COSRI Pain Management Summary tool was developed by making substantial enhancements to the AHRQ CDS Pain Management Summary tool. That tool was developed as part of the CDS Connect project https://cds.ahrq.gov/, sponsored by the Agency for Healthcare Research and Quality (AHRQ), and developed under contract with AHRQ by MITRE's CAMH FFRDC. The CDS Pain Management Summary tool is  a SMART on FHIR dashboard for managing pain, intended to be run within an EHR.  The development of COSRI on top of that work entailed enhancements including integration of a FHIR endpoint for PDMP data, new user interface elements, new CQL logic representing WA state rules, MED calculations and visualizations, auditing,  and other features.  Needless to say, we stand on the shoulders of giants, and are grateful that they shared their wisdom and experience through an open source codebase that served us well as a point of departure for developing COSRI.

"COSRI" is developed by https://cirg.washington.edu as part of our open-source body of work (https://github.com/uwcirg) for the Washington State Department of Health and Washington State Health Care Authority.

## About (from AHRQ CDS description, updated)

The Pain Management Summary SMART on FHIR application was developed to support the pilot of the CDS artifact, [Factors to Consider in Managing Chronic Pain: A Pain Management Summary](https://cds.ahrq.gov/cdsconnect/artifact/factors-consider-managing-chronic-pain-pain-management-summary).  This artifact presents a variety of key "factors" for clinicians to consider when assessing the history of a patient's chronic pain.  These factors include subjective and objective findings, along with recorded treatments and interventions to inform shared decision making on treatments moving forward.

The Pain Management Summary SMART on FHIR application was piloted during Summer 2018.  Local modifications and development were needed to fully support this application in the pilot environment.  For example, custom development was needed to expose pain assessments via the FHIR API. See the pilot reports for more information.

This application was originally piloted with support for FHIR DSTU2.  The app has been updated since the pilot to also support FHIR R4.  In addition, value sets and standardized codes have been updated since the pilot.  See the comments in the bundled CQL for details.

This prototype application is part of the [CDS Connect](https://cds.ahrq.gov/cdsconnect) project, sponsored by the [Agency for Healthcare Research and Quality](https://www.ahrq.gov/) (AHRQ), and developed under contract with AHRQ by [MITRE's CAMH](https://www.mitre.org/centers/cms-alliances-to-modernize-healthcare/who-we-are) FFRDC.

## Contributions

For information about contributing to this project, please see [CONTRIBUTING](CONTRIBUTING.md).

## Development Details

The Pain Management Summary is a web-based application implemented with the popular [React](https://reactjs.org/) JavaScript framework. The application adheres to the [SMART on FHIR](https://smarthealthit.org/) standard, allowing it to be integrated into EHR products that support the SMART on FHIR platform. To ensure the best adherence to the standard, the Pain Management Summary application uses the open source [FHIR client](https://github.com/smart-on-fhir/client-js) library provided by the SMART Health IT group.

The logic used to determine what data to display in the Pain Management Summary is defined using [CQL](http://cql.hl7.org/) and integrated into the application as the corresponding JSON ELM representation of the CQL.  The application analyzes the JSON ELM representation to determine what data is needed and then makes the corresponding queries to the FHIR server.

Once the necessary FHIR data has been retrieved from the EHR, the open source [CQL execution engine](https://github.com/cqframework/cql-execution) library is invoked with it and the JSON ELM to calculate the structured summary of the data to display to the user.  This structured summary is then used by the React components to render a user-friendly view of the information.

### Limitations

This CDS logic queries for several concepts that do not yet have standardized codes.  To support this, the following local codes have been defined:

| Code | System | Display |
| --- | --- | --- |
| SQETOHUSE | http://cds.ahrq.gov/cdsconnect/pms | Single question r/t ETOH use |
| SQDRUGUSE | http://cds.ahrq.gov/cdsconnect/pms | Single question r/t drug use |
| MME | http://cds.ahrq.gov/cdsconnect/pms | Morphine Milligram Equivalent (MME) |

Systems integrating the Pain Management Summary will need to expose the corresponding data as observations using the codes above.  As standardized codes become available, these local codes will be replaced.

### To build and run in development:

1. Install [Node.js](https://nodejs.org/en/download/) (LTS edition, currently 20.x)
2. Install [Yarn](https://yarnpkg.com/en/docs/install) (1.3.x or above)
3. Install dependencies by executing `yarn` from the project's root directory
4. If you have a SMART-on-FHIR client ID, edit `public/launch-context.json` to specify it
5. NOTE: The launch context contains `"completeInTarget": true`. This is needed if you are running in an environment that initializes the app in a separate window (such as the public SMART sandbox).  It can be safely removed in other cases.
6. If you'll be launching the app from an Epic EHR, modify `.env` to set `REACT_APP_EPIC_SUPPORTED_QUERIES` to `true`
7. Serve the code by executing `yarn start` (runs on port 8000)

## To build and deploy using a standard web server (static HTML and JS)

The Pain Management Summary can be deployed as static web resources on any HTTP server.  There are several customizations, however, that need to be made based on the site where it is deployed.

1. Install [Node.js](https://nodejs.org/en/download/) (LTS edition, currently 20.x)
2. Install [Yarn](https://yarnpkg.com/en/docs/install) (1.3.x or above)
3. Install dependencies by executing `yarn` from the project's root directory
4. Modify the `base` value in `vite.config.mjs` to reflect the path (after the hostname) at which it will be deployed
   a. The path must start and end with a forward slash (`/`).
   b. For example, if deploying to https://my-server/pain-mgmt-summary/, the `base` value should be `"/pain-mgmt-summary/"`.
   c. If deploying to the root of the domain, set the `base` value to `"/"` or comment out the `base` property.
5. Modify the `clientId` in `public/launch-context.json` to match the unique client ID you registered with the EHR from which this app will be launched
6. NOTE: The launch context contains `"completeInTarget": true`. This is needed if you are running in an environment that initializes the app in a separate window (such as the public SMART sandbox).  It can be safely removed in other cases.
7. If you've set up an analytics endpoint (see below), set the `analytics_endpoint` and `x_api_key` in `public/config.json`
8. If you'll be launching the app from an Epic EHR, modify `.env` to set `REACT_APP_EPIC_SUPPORTED_QUERIES` to `true`
   a. This modifies some queries based on Epic-specific requirements
9. Run `yarn build` to compile the code to static files in the `dist` folder
10. Deploy the output from the `dist` folder to a standard web server

Optionally to step 9, you can run `yarn serve` to use Vite's built-in server to host the code in `dist`. This approach, however, should not be used in production.

### To update the valueset-db.json file

The value set content used by the CQL is cached in a file named `valueset-db.json`.  If the CQL has been modified to add or remove value sets, or if the value sets themselves have been updated, you may wish to update the valueset-db.json with the latest codes.  To do this, you will need a [UMLS Terminology Services account](https://uts.nlm.nih.gov//license.html).

To update the `valueset-db.json` file:

1. Run `node src/utils/updateValueSetDB.js UMLS_API_KEY` _(replacing UMLS\_API\_KEY with your actual UMLS API key)_

To get you UMLS API Key:

1. Sign into your UMLS account at [https://uts.nlm.nih.gov/uts.html](https://uts.nlm.nih.gov/uts.html)
2. Click 'My Profile' in the orange banner at the top of the screen
3. Your API key should be listed below your username in the table
4. If no API key is listed:
   1. Click 'Edit Profile'
   2. Select the 'Generate new API Key' checkbox
   3. Click 'Save Profile'
   4. Your new API key should now be listed.

### To update the test patients' date-based fields

Testing this SMART App is more meaningful when we can supply test patients that exercise various aspects of the application.  Test patients are represented as FHIR bundles at `src/utils/dstu2_test_patients` and `r4_test_patients`.  Since the CDS uses lookbacks (for example, only show MME in the last 6 months), the patient data occasionally needs to be updated to fit within the lookback windows. To automatically update the data to fit within the lookback windows as of today's date:

1. Run `yarn update-test-patients`

This will update all of the entries in the patient bundles to be appropriate relative to today's date. In addition, it sets each bundle's `meta.lastUpdated` to the current date. This is essential for ensuring that future updates work correctly since it uses the `meta.lastUpdated` date to determine how far back each other date should be relative to today.

### To run the unit tests

To execute the unit tests:

1. Run `yarn test`

## To test the app using the public SMART sandbox

Run the app via one of the options above, then:

1. Browse to http://launch.smarthealthit.org/
2. Select `R2 (DSTU2)` or `R4` from the FHIR Version dropdown
3. In the _App Launch URL_ box at the bottom of the page, enter: `http://localhost:8000/launch.html`
4. Click _Launch App!_
5. Select a patient

### To upload test patients to the public SMART sandbox

Testing this SMART App is more meaningful when we can supply test patients that exercise various aspects of the application.  Test patients are represented as FHIR bundles at `src/utils/dstu2_test_patients` and `r4_test_patients`.  To upload the test patients to the public SMART sandbox:

1. Run `yarn upload-test-patients`

This adds a number of patients, mostly with the last name "Jackson" (for example, "Fuller Jackson" has entries in every section of the app).  The SMART sandbox may be reset at any time, so you may need to run this command again if the database has been reset.

### To test the app in standalone mode using the public SMART sandbox

The SMART launcher has a bug that doesn't allow IE 11 to enter the launch URL.  This makes testing in IE 11 very difficult.  To overcome this, you can reconfigure the app as a standalone app.  To do so, follow these steps:

1. Overwrite the `/public/launch-context.json` file with these contents:
   ```json
   {
     "clientId": "6c12dff4-24e7-4475-a742-b08972c4ea27",
     "scope":  "patient/*.read launch/patient",
     "iss": "url-goes-here"
   }
   ```
2. Restart the application server
3. Browse to http://launch.smarthealthit.org/
4. Select `R2 (DSTU2)` or `R4` from the FHIR Version dropdown
5. In _Launch Type_, choose **Provider Standalone Launch**
6. Copy the FHIR URL in the _FHIR Server URL_ box at the bottom of the page (e.g., `http://launch.smarthealthit.org/v/r2/sim/eyJoIjoiMSIsImkiOiIxIiwiaiI6IjEifQ/fhir`)
7. Paste it into `/public/launch-context.json` file where `url-goes-here` is
8. Browse to http://localhost:8000/launch.html

_NOTE: Do *not* check in the modified launch-context.json!_

## To test the app using the Epic SMART sandbox

The public Epic sandbox does not provide any synthetic patients that exercise the Pain Management Summary logic very well.  For this reason, testing against the public Epic sandbox is generally only useful to prove basic connection capability.

Run the app via one of the options above, then:

1. Browse to https://open.epic.com/Launchpad/Oauth2Sso
2. Select a patient from the dropdown
3. In the _YOUR APP'S LAUNCH URL_ box, enter: `http://localhost:8000/launch.html`
4. In the _YOUR APP'S OAUTH2 REDIRECT URL_ box, enter: `http://localhost:8000/`
5. Click _Launch App_

## Advanced: To post application analytics

This app can post JSON-formatted analytic data to an endpoint each time the application is invoked.

The data that is posted reports whether or not the patient met the CDS inclusion criteria, lists each section and subsection of the summary (along with the number of entries in each subsection), and provides an overall count of entries.  The basic form of the data is as follows:

```
{
  "meetsInclusionCriteria": <boolean>,
  "sections": [
    {
      "section": <stringName>,
      "subSections": [
        { "subSection": <stringName>, "numEntries": <intCount> },
        ...
      ]
    },
    ...
  ],
  "totalNumEntries": <intCount>
}
```

To enable posting of analytics, configure the `analytics_endpoint` and `x_api_key` in the `public/config.json` file. The default value is an empty string, which will not post any analytics.
