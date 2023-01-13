/* eslint-disable max-len */

// entry for every sub-section
const mockSummaryA = {
  "Patient": {
    "Name": "Fuller Jackson",
    "Gender": "male",
    "Age": 64,
    "MeetsInclusionCriteria": true
  },
  "PertinentMedicalHistory": {
    "ConditionsAssociatedWithChronicPain": [
      {
        "Name": "Fibromyalgia (disorder)",
        "Status": "active",
        "Onset": "2012-04-05T00:00:00.000+00:00"
      }
    ],
    "RiskFactorsForOpioidRelatedHarms": [
      {
        "Name": "Agoraphobia with panic attacks (disorder)",
        "Status": "active",
        "Onset": "2014-09-05T00:00:00.000+00:00",
        "Abatement": null,
        "Visit": null
      },
      {
        "Name": "Suicide attempt, initial encounter",
        "Status": null,
        "Onset": null,
        "Abatement": null,
        "Visit": {
          "Start": "2015-02-01T00:00:00.000+00:00",
          "End": null
        }
      }
    ]
  },
  "PainAssessments": {
    "NumericPainIntensityAssessments": [
      {
        "Name": "Pain severity Wong-Baker FACES Scale",
        "Score": "8",
        "Interpretation": "Hurts a whole lot",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "PainEnjoymentGeneralActivityAssessments": [
      {
        "Name": "Pain Enjoyment General Activity (PEG) Assessment",
        "Score": "5",
        "Interpretation": null,
        "Questions": [
          {
            "Name": "Pain",
            "Score": "7"
          },
          {
            "Name": "Enjoyment of life",
            "Score": "5"
          },
          {
            "Name": "General activity",
            "Score": "4"
          }
        ],
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "STarTBackAssessments": [
      {
        "Name": "STarT Back Screening Tool",
        "Score": "4",
        "Interpretation": "Medium risk",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ]
  },
  "HistoricalTreatments": {
    "OpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Pentazocine 50 MG Oral Tablet",
        "Start": "2018-03-15T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "12 HR Oxycodone Hydrochloride 160 MG Extended Release Oral Tablet",
        "Start": "2018-02-10T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonOpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Aspirin 75 MG Oral Tablet",
        "Start": "2018-01-06T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Statement",
        "Name": "Ibuprofen 200 MG Oral Tablet",
        "Start": "2017-11-12T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonPharmacologicTreatments": [
      {
        "Type": "Procedure",
        "Name": "Chiropraxy (regime/therapy)",
        "Date": "2018-04-05T00:00:00.000+00:00"
      }
    ],
    "StoolSoftenersAndLaxatives": [
      {
        "Type": "Statement",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-04-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ]
  },
  "RiskConsiderations": {
    "RiskScreeningsRelevantToPainManagement": [
      {
        "Name": "Patient Health Questionnaire 9 item (PHQ-9) total score [Reported]",
        "Score": "7",
        "Interpretation": "Mild depression",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "BenzodiazepineMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NaloxoneMedications": [
      {
        "Type": "Order",
        "Name": "Naloxone Hydrochloride 40 MG/ML Nasal Spray",
        "Start": "2018-04-20T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Statement",
        "Name": "Naloxone Hydrochloride 40 MG/ML Nasal Spray",
        "Start": "2018-04-10T00:00:00.000+00:00",
        "End": null
      }
    ],
    "UrineDrugScreens": [
      {
        "Name": "Opiates [Presence] in Urine by Screen method",
        "Result": "2300 ng/mL",
        "Interpretation": "Negative",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "MostRecentMME": {
      "Name": "Morphine Milligram Equivalent (MME)",
      "Result": "20 {MME}/d",
      "Date": "2018-04-30T00:00:00.000+00:00"
    }
  }
};

// no stool softeners, no benzo, no naloxone, no drug screen, has opioids, MME >= 50
const mockSummaryB = {
  "Patient": {
    "Name": "Ben Jackson",
    "Gender": "male",
    "Age": 64,
    "MeetsInclusionCriteria": true
  },
  "PertinentMedicalHistory": {
    "ConditionsAssociatedWithChronicPain": [
      {
        "Name": "Fibromyalgia (disorder)",
        "Status": "active",
        "Onset": "2012-04-05T00:00:00.000+00:00"
      }
    ],
    "RiskFactorsForOpioidRelatedHarms": [
      {
        "Name": "Agoraphobia with panic attacks (disorder)",
        "Status": "active",
        "Onset": "2014-09-05T00:00:00.000+00:00",
        "Abatement": null,
        "Visit": null
      }
    ]
  },
  "PainAssessments": {
    "NumericPainIntensityAssessments": [
      {
        "Name": "Pain severity Wong-Baker FACES Scale",
        "Score": "8",
        "Interpretation": "Hurts a whole lot",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "PainEnjoymentGeneralActivityAssessments": [
      {
        "Name": "Pain Enjoyment General Activity (PEG) Assessment",
        "Score": "5",
        "Interpretation": null,
        "Questions": [
          {
            "Name": "Pain",
            "Score": "7"
          },
          {
            "Name": "Enjoyment of life",
            "Score": "5"
          },
          {
            "Name": "General activity",
            "Score": "4"
          }
        ],
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "STarTBackAssessments": [
      {
        "Name": "STarT Back Screening Tool",
        "Score": "4",
        "Interpretation": "Medium risk",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ]
  },
  "HistoricalTreatments": {
    "OpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Pentazocine 50 MG Oral Tablet",
        "Start": "2018-03-15T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "12 HR Oxycodone Hydrochloride 160 MG Extended Release Oral Tablet",
        "Start": "2018-02-10T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonOpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Aspirin 75 MG Oral Tablet",
        "Start": "2018-01-06T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Statement",
        "Name": "Ibuprofen 200 MG Oral Tablet",
        "Start": "2017-11-12T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonPharmacologicTreatments": [
      {
        "Type": "Procedure",
        "Name": "Chiropraxy (regime/therapy)",
        "Date": "2018-04-05T00:00:00.000+00:00"
      }
    ],
    "StoolSoftenersAndLaxatives": []
  },
  "RiskConsiderations": {
    "RiskScreeningsRelevantToPainManagement": [
      {
        "Name": "Patient Health Questionnaire 9 item (PHQ-9) total score [Reported]",
        "Score": "7",
        "Interpretation": "Mild depression",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "BenzodiazepineMedications": [],
    "NaloxoneMedications": [],
    "UrineDrugScreens": [],
    "MostRecentMME": {
      "Name": "Morphine Milligram Equivalent (MME)",
      "Result": "60 {MME}/d",
      "Date": "2018-04-30T00:00:00.000+00:00"
    }
  }
};

// has stool softeners, has benzo, no naloxone, no drug screen, no opioids, MME >= 50
const mockSummaryC = {
  "Patient": {
    "Name": "Fuller Jackson",
    "Gender": "male",
    "Age": 64,
    "MeetsInclusionCriteria": true
  },
  "PertinentMedicalHistory": {
    "ConditionsAssociatedWithChronicPain": [
      {
        "Name": "Fibromyalgia (disorder)",
        "Status": "active",
        "Onset": "2012-04-05T00:00:00.000+00:00"
      }
    ],
    "RiskFactorsForOpioidRelatedHarms": [
      {
        "Name": "Agoraphobia with panic attacks (disorder)",
        "Status": "active",
        "Onset": "2014-09-05T00:00:00.000+00:00",
        "Abatement": null,
        "Visit": null
      }
    ]
  },
  "PainAssessments": {
    "NumericPainIntensityAssessments": [
      {
        "Name": "Pain severity Wong-Baker FACES Scale",
        "Score": "8",
        "Interpretation": "Hurts a whole lot",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "PainEnjoymentGeneralActivityAssessments": [
      {
        "Name": "Pain Enjoyment General Activity (PEG) Assessment",
        "Score": "5",
        "Interpretation": null,
        "Questions": [
          {
            "Name": "Pain",
            "Score": "7"
          },
          {
            "Name": "Enjoyment of life",
            "Score": "5"
          },
          {
            "Name": "General activity",
            "Score": "4"
          }
        ],
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "STarTBackAssessments": [
      {
        "Name": "STarT Back Screening Tool",
        "Score": "4",
        "Interpretation": "Medium risk",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ]
  },
  "HistoricalTreatments": {
    "OpioidMedications": [],
    "NonOpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Aspirin 75 MG Oral Tablet",
        "Start": "2018-01-06T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Statement",
        "Name": "Ibuprofen 200 MG Oral Tablet",
        "Start": "2017-11-12T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonPharmacologicTreatments": [
      {
        "Type": "Procedure",
        "Name": "Chiropraxy (regime/therapy)",
        "Date": "2018-04-05T00:00:00.000+00:00"
      }
    ],
    "StoolSoftenersAndLaxatives": [
      {
        "Type": "Statement",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-04-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ]
  },
  "RiskConsiderations": {
    "RiskScreeningsRelevantToPainManagement": [
      {
        "Name": "Patient Health Questionnaire 9 item (PHQ-9) total score [Reported]",
        "Score": "7",
        "Interpretation": "Mild depression",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "BenzodiazepineMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NaloxoneMedications": [],
    "UrineDrugScreens": [],
    "MostRecentMME": {
      "Name": "Morphine Milligram Equivalent (MME)",
      "Result": "50 {MME}/d",
      "Date": "2018-04-30T00:00:00.000+00:00"
    }
  }
};

// no opioids, no naloxone, no benzo, no non-opioid, has drug screen, no non-pharma, MME < 50
const mockSummaryD = {
  "Patient": {
    "Name": "Fuller Jackson",
    "Gender": "male",
    "Age": 64,
    "MeetsInclusionCriteria": true
  },
  "PertinentMedicalHistory": {
    "ConditionsAssociatedWithChronicPain": [
      {
        "Name": "Fibromyalgia (disorder)",
        "Status": "active",
        "Onset": "2012-04-05T00:00:00.000+00:00"
      }
    ],
    "RiskFactorsForOpioidRelatedHarms": [
      {
        "Name": "Agoraphobia with panic attacks (disorder)",
        "Status": "active",
        "Onset": "2014-09-05T00:00:00.000+00:00",
        "Abatement": null,
        "Visit": null
      }
    ]
  },
  "PainAssessments": {
    "NumericPainIntensityAssessments": [
      {
        "Name": "Pain severity Wong-Baker FACES Scale",
        "Score": "8",
        "Interpretation": "Hurts a whole lot",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "PainEnjoymentGeneralActivityAssessments": [
      {
        "Name": "Pain Enjoyment General Activity (PEG) Assessment",
        "Score": "5",
        "Interpretation": null,
        "Questions": [
          {
            "Name": "Pain",
            "Score": "7"
          },
          {
            "Name": "Enjoyment of life",
            "Score": "5"
          },
          {
            "Name": "General activity",
            "Score": "4"
          }
        ],
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "STarTBackAssessments": [
      {
        "Name": "STarT Back Screening Tool",
        "Score": "4",
        "Interpretation": "Medium risk",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ]
  },
  "HistoricalTreatments": {
    "OpioidMedications": [],
    "NonOpioidMedications": [],
    "NonPharmacologicTreatments": [],
    "StoolSoftenersAndLaxatives": [
      {
        "Type": "Statement",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-04-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ]
  },
  "RiskConsiderations": {
    "RiskScreeningsRelevantToPainManagement": [
      {
        "Name": "Patient Health Questionnaire 9 item (PHQ-9) total score [Reported]",
        "Score": "7",
        "Interpretation": "Mild depression",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "BenzodiazepineMedications": [],
    "NaloxoneMedications": [],
    "UrineDrugScreens": [
      {
        "Name": "Opiates [Presence] in Urine by Screen method",
        "Result": "2300 ng/mL",
        "Interpretation": "Negative",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "MostRecentMME": {
      "Name": "Morphine Milligram Equivalent (MME)",
      "Result": "20 {MME}/d",
      "Date": "2018-04-30T00:00:00.000+00:00"
    }
  }
};

// no naloxone, has opioids, MME < 50
const mockSummaryE = {
  "Patient": {
    "Name": "Fuller Jackson",
    "Gender": "male",
    "Age": 64,
    "MeetsInclusionCriteria": true
  },
  "PertinentMedicalHistory": {
    "ConditionsAssociatedWithChronicPain": [
      {
        "Name": "Fibromyalgia (disorder)",
        "Status": "active",
        "Onset": "2012-04-05T00:00:00.000+00:00"
      }
    ],
    "RiskFactorsForOpioidRelatedHarms": [
      {
        "Name": "Agoraphobia with panic attacks (disorder)",
        "Status": "active",
        "Onset": "2014-09-05T00:00:00.000+00:00",
        "Abatement": null,
        "Visit": null
      }
    ]
  },
  "PainAssessments": {
    "NumericPainIntensityAssessments": [
      {
        "Name": "Pain severity Wong-Baker FACES Scale",
        "Score": "8",
        "Interpretation": "Hurts a whole lot",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "PainEnjoymentGeneralActivityAssessments": [
      {
        "Name": "Pain Enjoyment General Activity (PEG) Assessment",
        "Score": "5",
        "Interpretation": null,
        "Questions": [
          {
            "Name": "Pain",
            "Score": "7"
          },
          {
            "Name": "Enjoyment of life",
            "Score": "5"
          },
          {
            "Name": "General activity",
            "Score": "4"
          }
        ],
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "STarTBackAssessments": [
      {
        "Name": "STarT Back Screening Tool",
        "Score": "4",
        "Interpretation": "Medium risk",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ]
  },
  "HistoricalTreatments": {
    "OpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Pentazocine 50 MG Oral Tablet",
        "Start": "2018-03-15T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "12 HR Oxycodone Hydrochloride 160 MG Extended Release Oral Tablet",
        "Start": "2018-02-10T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonOpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Aspirin 75 MG Oral Tablet",
        "Start": "2018-01-06T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Statement",
        "Name": "Ibuprofen 200 MG Oral Tablet",
        "Start": "2017-11-12T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonPharmacologicTreatments": [
      {
        "Type": "Procedure",
        "Name": "Chiropraxy (regime/therapy)",
        "Date": "2018-04-05T00:00:00.000+00:00"
      }
    ],
    "StoolSoftenersAndLaxatives": [
      {
        "Type": "Statement",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-04-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ]
  },
  "RiskConsiderations": {
    "RiskScreeningsRelevantToPainManagement": [
      {
        "Name": "Patient Health Questionnaire 9 item (PHQ-9) total score [Reported]",
        "Score": "7",
        "Interpretation": "Mild depression",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "BenzodiazepineMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NaloxoneMedications": [],
    "UrineDrugScreens": [
      {
        "Name": "Opiates [Presence] in Urine by Screen method",
        "Result": "2300 ng/mL",
        "Interpretation": "Negative",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "MostRecentMME": {
      "Name": "Morphine Milligram Equivalent (MME)",
      "Result": "20 {MME}/d",
      "Date": "2018-04-30T00:00:00.000+00:00"
    }
  }
};

// has nalox, MME >= 50
const mockSummaryF = {
  "Patient": {
    "Name": "Fuller Jackson",
    "Gender": "male",
    "Age": 64,
    "MeetsInclusionCriteria": true
  },
  "PertinentMedicalHistory": {
    "ConditionsAssociatedWithChronicPain": [
      {
        "Name": "Fibromyalgia (disorder)",
        "Status": "active",
        "Onset": "2012-04-05T00:00:00.000+00:00"
      }
    ],
    "RiskFactorsForOpioidRelatedHarms": [
      {
        "Name": "Agoraphobia with panic attacks (disorder)",
        "Status": "active",
        "Onset": "2014-09-05T00:00:00.000+00:00",
        "Abatement": null,
        "Visit": null
      }
    ]
  },
  "PainAssessments": {
    "NumericPainIntensityAssessments": [
      {
        "Name": "Pain severity Wong-Baker FACES Scale",
        "Score": "8",
        "Interpretation": "Hurts a whole lot",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "PainEnjoymentGeneralActivityAssessments": [
      {
        "Name": "Pain Enjoyment General Activity (PEG) Assessment",
        "Score": "5",
        "Interpretation": null,
        "Questions": [
          {
            "Name": "Pain",
            "Score": "7"
          },
          {
            "Name": "Enjoyment of life",
            "Score": "5"
          },
          {
            "Name": "General activity",
            "Score": "4"
          }
        ],
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "STarTBackAssessments": [
      {
        "Name": "STarT Back Screening Tool",
        "Score": "4",
        "Interpretation": "Medium risk",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ]
  },
  "HistoricalTreatments": {
    "OpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Pentazocine 50 MG Oral Tablet",
        "Start": "2018-03-15T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "12 HR Oxycodone Hydrochloride 160 MG Extended Release Oral Tablet",
        "Start": "2018-02-10T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonOpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Aspirin 75 MG Oral Tablet",
        "Start": "2018-01-06T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Statement",
        "Name": "Ibuprofen 200 MG Oral Tablet",
        "Start": "2017-11-12T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonPharmacologicTreatments": [
      {
        "Type": "Procedure",
        "Name": "Chiropraxy (regime/therapy)",
        "Date": "2018-04-05T00:00:00.000+00:00"
      }
    ],
    "StoolSoftenersAndLaxatives": [
      {
        "Type": "Statement",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-04-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ]
  },
  "RiskConsiderations": {
    "RiskScreeningsRelevantToPainManagement": [
      {
        "Name": "Patient Health Questionnaire 9 item (PHQ-9) total score [Reported]",
        "Score": "7",
        "Interpretation": "Mild depression",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "BenzodiazepineMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NaloxoneMedications": [
      {
        "Type": "Order",
        "Name": "Naloxone Hydrochloride 40 MG/ML Nasal Spray",
        "Start": "2018-04-20T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Statement",
        "Name": "Naloxone Hydrochloride 40 MG/ML Nasal Spray",
        "Start": "2018-04-10T00:00:00.000+00:00",
        "End": null
      }
    ],
    "UrineDrugScreens": [
      {
        "Name": "Opiates [Presence] in Urine by Screen method",
        "Result": "2300 ng/mL",
        "Interpretation": "Negative",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "MostRecentMME": {
      "Name": "Morphine Milligram Equivalent (MME)",
      "Result": "50 {MME}/d",
      "Date": "2018-04-30T00:00:00.000+00:00"
    }
  }
};

// no naloxone, MME >= 50
const mockSummaryG = {
  "Patient": {
    "Name": "Fuller Jackson",
    "Gender": "male",
    "Age": 64,
    "MeetsInclusionCriteria": true
  },
  "PertinentMedicalHistory": {
    "ConditionsAssociatedWithChronicPain": [
      {
        "Name": "Fibromyalgia (disorder)",
        "Status": "active",
        "Onset": "2012-04-05T00:00:00.000+00:00"
      }
    ],
    "RiskFactorsForOpioidRelatedHarms": [
      {
        "Name": "Agoraphobia with panic attacks (disorder)",
        "Status": "active",
        "Onset": "2014-09-05T00:00:00.000+00:00",
        "Abatement": null,
        "Visit": null
      }
    ]
  },
  "PainAssessments": {
    "NumericPainIntensityAssessments": [
      {
        "Name": "Pain severity Wong-Baker FACES Scale",
        "Score": "8",
        "Interpretation": "Hurts a whole lot",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "PainEnjoymentGeneralActivityAssessments": [
      {
        "Name": "Pain Enjoyment General Activity (PEG) Assessment",
        "Score": "5",
        "Interpretation": null,
        "Questions": [
          {
            "Name": "Pain",
            "Score": "7"
          },
          {
            "Name": "Enjoyment of life",
            "Score": "5"
          },
          {
            "Name": "General activity",
            "Score": "4"
          }
        ],
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ],
    "STarTBackAssessments": [
      {
        "Name": "STarT Back Screening Tool",
        "Score": "4",
        "Interpretation": "Medium risk",
        "Date": "2018-02-10T00:00:00.000+00:00"
      }
    ]
  },
  "HistoricalTreatments": {
    "OpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Pentazocine 50 MG Oral Tablet",
        "Start": "2018-03-15T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "12 HR Oxycodone Hydrochloride 160 MG Extended Release Oral Tablet",
        "Start": "2018-02-10T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonOpioidMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Aspirin 75 MG Oral Tablet",
        "Start": "2018-01-06T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Statement",
        "Name": "Ibuprofen 200 MG Oral Tablet",
        "Start": "2017-11-12T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NonPharmacologicTreatments": [
      {
        "Type": "Procedure",
        "Name": "Chiropraxy (regime/therapy)",
        "Date": "2018-04-05T00:00:00.000+00:00"
      }
    ],
    "StoolSoftenersAndLaxatives": [
      {
        "Type": "Statement",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-04-05T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "POLYETHYLENE GLYCOL 3350 17000 MG Powder for Oral Solution",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ]
  },
  "RiskConsiderations": {
    "RiskScreeningsRelevantToPainManagement": [
      {
        "Name": "Patient Health Questionnaire 9 item (PHQ-9) total score [Reported]",
        "Score": "7",
        "Interpretation": "Mild depression",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "BenzodiazepineMedications": [
      {
        "Type": "Statement",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-04-30T00:00:00.000+00:00",
        "End": null
      },
      {
        "Type": "Order",
        "Name": "Diazepam 5 MG Oral Tablet",
        "Start": "2018-03-05T00:00:00.000+00:00",
        "End": null
      }
    ],
    "NaloxoneMedications": [],
    "UrineDrugScreens": [
      {
        "Name": "Opiates [Presence] in Urine by Screen method",
        "Result": "2300 ng/mL",
        "Interpretation": "Negative",
        "Date": "2017-10-20T00:00:00.000+00:00"
      }
    ],
    "MostRecentMME": {
      "Name": "Morphine Milligram Equivalent (MME)",
      "Result": "50 {MME}/d",
      "Date": "2018-04-30T00:00:00.000+00:00"
    }
  }
};

const mockSectionFlags = {
  "PertinentMedicalHistory": {
    "ConditionsAssociatedWithChronicPain": [],
    "RiskFactorsForOpioidRelatedHarms": [
      2
    ]
  },
  "PainAssessments": {
    "NumericPainIntensityAssessments": [],
    "PainEnjoymentGeneralActivityAssessments": [],
    "STarTBackAssessments": []
  },
  "HistoricalTreatments": {
    "OpioidMedications": [
      6,
      7
    ],
    "NonOpioidMedications": [],
    "NonPharmacologicTreatments": [],
    "StoolSoftenersAndLaxatives": []
  },
  "RiskConsiderations": {
    "RiskScreeningsRelevantToPainManagement": [],
    "BenzodiazepineMedications": [
      16,
      17
    ],
    "NaloxoneMedications": [],
    "UrineDrugScreens": [],
    "MostRecentMME": []
  }
};

const mockSubSection = {
  "name": "Pain Enjoyment General Activity (PEG) Assessments",
  "dataKey": "PainEnjoymentGeneralActivityAssessments",
  "dataKeySource": "PainAssessments",
  "info": [
    {
      "type": "elements",
      "description": "Pain Enjoyment General Activity (PEG) Assessments queries the following elements:",
      "elements": [
        {
          "name": "Pain Enjoyment General Activity (PEG) Assessment",
          "status": "final or amended",
          "lookback": "2 years"
        }
      ]
    },
    {
      "type": "reference",
      "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2686775/",
      "title": "Development and Initial Validation of the PEG, a Three-item Scale Assessing Pain Intensity and Interference",
      "details": "The PEG is freely available in the public domain. Publications and reports should cite the original publication: Krebs EE, Lorenz KA, Bair MJ, Damush TA, Wu J, Sutherland JM, Asch SM, Kroenke K. Development and initial validation of the PEG, a 3-item scale assessing pain intensity and interference. Journal of General Internal Medicine. 2009 Jun;24:733-738."
    }
  ],
  "tables": [
    {
      "headers": {
        "Name": "Name",
        "Score": "Score",
        "Question": {
          "key": "Questions",
          "formatter": "arrayFlatten",
          "formatterArguments": ["Name"],
          "sortable": false,
          "minWidth": 200
        },
        "Question Score": {
          "key": "Questions",
          "formatter": "arrayFlatten",
          "formatterArguments": ["Score"],
          "sortable": false,
          "minWidth": 150
        },
        "Date": { "key": "Date", "formatter": "datishFormat" }
      }
    }
  ]
}

export {
  mockSummaryA,
  mockSummaryB,
  mockSummaryC,
  mockSummaryD,
  mockSummaryE,
  mockSummaryF,
  mockSummaryG,
  mockSectionFlags,
  mockSubSection
};

export const mockSurveySummaryData = [
  {
    QuestionnaireName: "phq9",
    QuestionnaireURL: "http://www.cdc.gov/ncbddd/fasd/phq9",
    question1LinkId: "/44250-9",
    question2LinkId: "/44255-8",
    question3LinkId: "/44259-0",
    question4LinkId: "/44254-1",
    question5LinkId: "/44251-7",
    question6LinkId: "/44258-2",
    question7LinkId: "/44252-5",
    question8LinkId: "/44253-3",
    question9LinkId: "/44260-8",
    question10LinkId: "/69722-7",
    ScoringQuestionId: "/44261-6",
    extensionAnswerIndex: 0,
    ScoreParams: {
      minScore: 0,
      maxScore: 27,
    },
    Patient: {
      identifier: [
        {
          system: {
            value: "https://github.com/synthetichealth/synthea",
          },
          value: {
            value: "3f228315-d2de-4292-a56a-b7c120c2875d",
          },
        },
        {
          type: {
            coding: [
              {
                system: {
                  value: "http://terminology.hl7.org/CodeSystem/v2-0203",
                },
                code: {
                  value: "MR",
                },
                display: {
                  value: "Medical Record Number",
                },
              },
            ],
            text: {
              value: "Medical Record Number",
            },
          },
          system: {
            value: "http://hospital.smarthealthit.org",
          },
          value: {
            value: "3f228315-d2de-4292-a56a-b7c120c2875d",
          },
        },
        {
          type: {
            coding: [
              {
                system: {
                  value: "http://terminology.hl7.org/CodeSystem/v2-0203",
                },
                code: {
                  value: "SS",
                },
                display: {
                  value: "Social Security Number",
                },
              },
            ],
            text: {
              value: "Social Security Number",
            },
          },
          system: {
            value: "http://hl7.org/fhir/sid/us-ssn",
          },
          value: {
            value: "999-58-3251",
          },
        },
        {
          type: {
            coding: [
              {
                system: {
                  value: "http://terminology.hl7.org/CodeSystem/v2-0203",
                },
                code: {
                  value: "DL",
                },
                display: {
                  value: "Driver's License",
                },
              },
            ],
            text: {
              value: "Driver's License",
            },
          },
          system: {
            value: "urn:oid:2.16.840.1.113883.4.3.25",
          },
          value: {
            value: "S99913820",
          },
        },
        {
          type: {
            coding: [
              {
                system: {
                  value: "http://terminology.hl7.org/CodeSystem/v2-0203",
                },
                code: {
                  value: "PPN",
                },
                display: {
                  value: "Passport Number",
                },
              },
            ],
            text: {
              value: "Passport Number",
            },
          },
          system: {
            value:
              "http://standardhealthrecord.org/fhir/StructureDefinition/passportNumber",
          },
          value: {
            value: "X50228204X",
          },
        },
      ],
      name: [
        {
          use: {
            value: "official",
          },
          family: {
            value: "Abbott",
          },
          given: [
            {
              value: "Barney",
            },
          ],
          prefix: [
            {
              value: "Mr.",
            },
          ],
        },
      ],
      telecom: [
        {
          system: {
            value: "phone",
          },
          value: {
            value: "555-901-9296",
          },
          use: {
            value: "home",
          },
        },
      ],
      gender: {
        value: "male",
      },
      birthDate: {
        value: "1964-03-18",
      },
      deceased: {
        value: "1989-02-15T08:54:18+00:00",
      },
      address: [
        {
          line: [
            {
              value: "440 Russel Common Apt 7",
            },
          ],
          city: {
            value: "Framingham",
          },
          state: {
            value: "Massachusetts",
          },
          postalCode: {
            value: "01701",
          },
          country: {
            value: "US",
          },
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/geolocation",
              extension: [
                {
                  url: "latitude",
                  value: {
                    value: 42.307905,
                  },
                },
                {
                  url: "longitude",
                  value: {
                    value: -71.436196,
                  },
                },
              ],
            },
          ],
        },
      ],
      maritalStatus: {
        coding: [
          {
            system: {
              value: "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
            },
            code: {
              value: "S",
            },
            display: {
              value: "Never Married",
            },
          },
        ],
        text: {
          value: "Never Married",
        },
      },
      multipleBirth: {
        value: false,
      },
      communication: [
        {
          language: {
            coding: [
              {
                system: {
                  value: "urn:ietf:bcp:47",
                },
                code: {
                  value: "en-US",
                },
                display: {
                  value: "English",
                },
              },
            ],
            text: {
              value: "English",
            },
          },
        },
      ],
      text: {
        status: {
          value: "generated",
        },
      },
      extension: [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
          extension: [
            {
              url: "ombCategory",
              value: {
                system: {
                  value: "urn:oid:2.16.840.1.113883.6.238",
                },
                code: {
                  value: "2106-3",
                },
                display: {
                  value: "White",
                },
              },
            },
            {
              url: "text",
              value: {
                value: "White",
              },
            },
          ],
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          extension: [
            {
              url: "ombCategory",
              value: {
                system: {
                  value: "urn:oid:2.16.840.1.113883.6.238",
                },
                code: {
                  value: "2186-5",
                },
                display: {
                  value: "Not Hispanic or Latino",
                },
              },
            },
            {
              url: "text",
              value: {
                value: "Not Hispanic or Latino",
              },
            },
          ],
        },
        {
          url: "http://hl7.org/fhir/StructureDefinition/patient-mothersMaidenName",
          value: {
            value: "Luise Grant",
          },
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
          value: {
            value: "M",
          },
        },
        {
          url: "http://hl7.org/fhir/StructureDefinition/patient-birthPlace",
          value: {
            city: {
              value: "Lee",
            },
            state: {
              value: "Massachusetts",
            },
            country: {
              value: "US",
            },
          },
        },
        {
          url: "http://synthetichealth.github.io/synthea/disability-adjusted-life-years",
          value: {
            value: 0.3868990459023335,
          },
        },
        {
          url: "http://synthetichealth.github.io/synthea/quality-adjusted-life-years",
          value: {
            value: 23.613100954097668,
          },
        },
      ],
      id: {
        value: "5ee05359-57bf-4cee-8e89-91382c07e162",
      },
      meta: {
        versionId: {
          value: "33",
        },
        lastUpdated: {
          value: "2022-07-27T03:07:06.020-04:00",
        },
        tag: [
          {
            system: {
              value: "https://smarthealthit.org/tags",
            },
            code: {
              value: "synthea-5-2019",
            },
          },
        ],
      },
    },
    Phq9Questionnaire: {
      url: {
        value: "http://www.cdc.gov/ncbddd/fasd/phq9",
      },
      identifier: [
        {
          system: {
            value: "http://hl7.org/fhir/uv/sdc/NamingSystem/questionnaire-ids",
          },
          value: {
            value: "phq9",
          },
        },
      ],
      name: {
        value: "phq9",
      },
      title: {
        value: "PHQ-9 quick depression assessment panel [Reported.PHQ]",
      },
      status: {
        value: "draft",
      },
      code: [
        {
          code: {
            value: "44249-1",
          },
          display: {
            value: "PHQ-9 quick depression assessment panel [Reported.PHQ]",
          },
        },
      ],
      item: [
        {
          linkId: {
            value: "/44250-9",
          },
          code: [
            {
              code: {
                value: "44250-9",
              },
              display: {
                value: "Little interest or pleasure in doing things",
              },
            },
          ],
          text: {
            value: "Little interest or pleasure in doing things",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              value: {
                coding: [
                  {
                    system: {
                      value: "http://hl7.org/fhir/questionnaire-item-control",
                    },
                    code: {
                      value: "drop-down",
                    },
                    display: {
                      value: "Drop down",
                    },
                  },
                ],
                text: {
                  value: "Drop down",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44255-8",
          },
          code: [
            {
              code: {
                value: "44255-8",
              },
              display: {
                value: "Feeling down, depressed, or hopeless",
              },
            },
          ],
          text: {
            value: "Feeling down, depressed, or hopeless",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              value: {
                coding: [
                  {
                    system: {
                      value: "http://hl7.org/fhir/questionnaire-item-control",
                    },
                    code: {
                      value: "drop-down",
                    },
                    display: {
                      value: "Drop down",
                    },
                  },
                ],
                text: {
                  value: "Drop down",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44259-0",
          },
          code: [
            {
              code: {
                value: "44259-0",
              },
              display: {
                value:
                  "Trouble falling or staying asleep, or sleeping too much",
              },
            },
          ],
          text: {
            value: "Trouble falling or staying asleep, or sleeping too much",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              value: {
                coding: [
                  {
                    system: {
                      value: "http://hl7.org/fhir/questionnaire-item-control",
                    },
                    code: {
                      value: "drop-down",
                    },
                    display: {
                      value: "Drop down",
                    },
                  },
                ],
                text: {
                  value: "Drop down",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44254-1",
          },
          code: [
            {
              code: {
                value: "44254-1",
              },
              display: {
                value: "Feeling tired or having little energy",
              },
            },
          ],
          text: {
            value: "Feeling tired or having little energy",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              value: {
                coding: [
                  {
                    system: {
                      value: "http://hl7.org/fhir/questionnaire-item-control",
                    },
                    code: {
                      value: "drop-down",
                    },
                    display: {
                      value: "Drop down",
                    },
                  },
                ],
                text: {
                  value: "Drop down",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44251-7",
          },
          code: [
            {
              code: {
                value: "44251-7",
              },
              display: {
                value: "Poor appetite or overeating",
              },
            },
          ],
          text: {
            value: "Poor appetite or overeating",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              value: {
                coding: [
                  {
                    system: {
                      value: "http://hl7.org/fhir/questionnaire-item-control",
                    },
                    code: {
                      value: "drop-down",
                    },
                    display: {
                      value: "Drop down",
                    },
                  },
                ],
                text: {
                  value: "Drop down",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44258-2",
          },
          code: [
            {
              code: {
                value: "44258-2",
              },
              display: {
                value:
                  "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
              },
            },
          ],
          text: {
            value:
              "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              value: {
                coding: [
                  {
                    system: {
                      value: "http://hl7.org/fhir/questionnaire-item-control",
                    },
                    code: {
                      value: "drop-down",
                    },
                    display: {
                      value: "Drop down",
                    },
                  },
                ],
                text: {
                  value: "Drop down",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44252-5",
          },
          code: [
            {
              code: {
                value: "44252-5",
              },
              display: {
                value:
                  "Trouble concentrating on things, such as reading the newspaper or watching television",
              },
            },
          ],
          text: {
            value:
              "Trouble concentrating on things, such as reading the newspaper or watching television",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              value: {
                coding: [
                  {
                    system: {
                      value: "http://hl7.org/fhir/questionnaire-item-control",
                    },
                    code: {
                      value: "drop-down",
                    },
                    display: {
                      value: "Drop down",
                    },
                  },
                ],
                text: {
                  value: "Drop down",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44253-3",
          },
          code: [
            {
              code: {
                value: "44253-3",
              },
              display: {
                value:
                  "Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual",
              },
            },
          ],
          text: {
            value:
              "Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              value: {
                coding: [
                  {
                    system: {
                      value: "http://hl7.org/fhir/questionnaire-item-control",
                    },
                    code: {
                      value: "drop-down",
                    },
                    display: {
                      value: "Drop down",
                    },
                  },
                ],
                text: {
                  value: "Drop down",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44260-8",
          },
          code: [
            {
              code: {
                value: "44260-8",
              },
              display: {
                value:
                  "Thoughts that you would be better off dead, or of hurting yourself in some way",
              },
            },
          ],
          text: {
            value:
              "Thoughts that you would be better off dead, or of hurting yourself in some way",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              value: {
                coding: [
                  {
                    system: {
                      value: "http://hl7.org/fhir/questionnaire-item-control",
                    },
                    code: {
                      value: "drop-down",
                    },
                    display: {
                      value: "Drop down",
                    },
                  },
                ],
                text: {
                  value: "Drop down",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/69722-7",
          },
          code: [
            {
              code: {
                value: "69722-7",
              },
              display: {
                value:
                  "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
              },
            },
          ],
          text: {
            value:
              "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6572-7",
                },
                display: {
                  value: "Not difficult at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6573-5",
                },
                display: {
                  value: "Somewhat difficult",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6575-0",
                },
                display: {
                  value: "Very difficult",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6574-3",
                },
                display: {
                  value: "Extremely difficult",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
              ],
            },
          ],
          item: [
            {
              linkId: {
                value: "/69722-7-help",
              },
              text: {
                value: "If you checked off any problems on this questionnaire",
              },
              type: {
                value: "display",
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                  value: {
                    coding: [
                      {
                        system: {
                          value:
                            "http://hl7.org/fhir/questionnaire-item-control",
                        },
                        code: {
                          value: "help",
                        },
                        display: {
                          value: "Help-Button",
                        },
                      },
                    ],
                    text: {
                      value: "Help-Button",
                    },
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              value: {
                coding: [
                  {
                    system: {
                      value: "http://hl7.org/fhir/questionnaire-item-control",
                    },
                    code: {
                      value: "drop-down",
                    },
                    display: {
                      value: "Drop down",
                    },
                  },
                ],
                text: {
                  value: "Drop down",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44261-6",
          },
          code: [
            {
              code: {
                value: "44261-6",
              },
              display: {
                value: "Patient health questionnaire 9 item total score",
              },
            },
          ],
          text: {
            value: "Patient health questionnaire 9 item total score",
          },
          type: {
            value: "decimal",
          },
          required: {
            value: false,
          },
          item: [
            {
              linkId: {
                value: "/44261-6-help",
              },
              text: {
                value:
                  "The PHQ-9 is the standard (and most commonly used) depression measure, and it ranges from 0-27 Scoring: Add up all checked boxes on PHQ-9. For every check: Not at all = 0; Several days = 1; More than half the days = 2; Nearly every day = 3 (the scores are the codes that appear in the answer list for each of the PHQ-9 problem panel terms). Interpretation: 1-4 = Minimal depression; 5-9 = Mild depression; 10-14 = Moderate depression; 15-19 = Moderately severe depression; 20-27 = Severed depression.",
              },
              type: {
                value: "display",
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                  value: {
                    coding: [
                      {
                        system: {
                          value:
                            "http://hl7.org/fhir/questionnaire-item-control",
                        },
                        code: {
                          value: "help",
                        },
                        display: {
                          value: "Help-Button",
                        },
                      },
                    ],
                    text: {
                      value: "Help-Button",
                    },
                  },
                },
              ],
            },
          ],
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/designNote",
              value: {
                value: "Display PHQ-9 Score",
              },
            },
            {
              url: "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression",
              value: {
                language: {
                  value: "text/cql",
                },
                expression: {
                  value: "DisplayScoreFullPhq9",
                },
                reference: {
                  value: "#Phq9LogicLibrary|1.0",
                },
              },
            },
            {
              url: "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression",
              value: {
                language: {
                  value: "text/cql",
                },
                expression: {
                  value: "ScoreFullPhq9",
                },
                reference: {
                  value: "#Phq9LogicLibrary|1.0",
                },
              },
            },
          ],
        },
      ],
      id: {
        value: "CIRG-PHQ9",
      },
      meta: {
        versionId: {
          value: "111",
        },
        lastUpdated: {
          value: "2023-01-13T12:05:27.842-05:00",
        },
        profile: [
          {
            value:
              "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire|2.7",
          },
        ],
        tag: [
          {
            code: {
              value: "lformsVersion: 28.1.1",
            },
          },
        ],
      },
    },
    IndexOfQuestion: {
      one: 0,
      two: 1,
      three: 2,
      four: 3,
      five: 4,
      six: 5,
      seven: 6,
      eight: 7,
      nine: 8,
      ten: 9,
    },
    QuestionnaireResponses: [
      {
        questionnaire: {
          value: "Questionnaire/CIRG-PHQ9",
        },
        status: {
          value: "completed",
        },
        subject: {
          reference: {
            value: "Patient/5ee05359-57bf-4cee-8e89-91382c07e162",
          },
        },
        authored: {
          value: "2023-01-04",
        },
        author: {
          reference: {
            value: "Practitioner/52919099-6a7a-442c-b0d5-2b02c0dd4b74",
          },
        },
        item: [
          {
            linkId: {
              value: "/44261-6",
            },
            text: {
              value: "Patient health questionnaire 9 item total score",
            },
            answer: [
              {
                value: {
                  value: 23,
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44250-9",
            },
            text: {
              value: "Little interest or pleasure in doing things",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6571-9",
                  },
                  display: {
                    value: "Nearly every day",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44255-8",
            },
            text: {
              value: "Feeling down, depressed, or hopeless",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6571-9",
                  },
                  display: {
                    value: "Nearly every day",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44259-0",
            },
            text: {
              value: "Trouble falling or staying asleep, or sleeping too much",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44254-1",
            },
            text: {
              value: "Feeling tired or having little energy",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44251-7",
            },
            text: {
              value: "Poor appetite or overeating",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44258-2",
            },
            text: {
              value:
                "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44252-5",
            },
            text: {
              value:
                "Trouble concentrating on things, such as reading the newspaper or watching television",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44253-3",
            },
            text: {
              value:
                "Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44260-8",
            },
            text: {
              value:
                "Thoughts that you would be better off dead, or of hurting yourself in some way",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6571-9",
                  },
                  display: {
                    value: "Nearly every day",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69722-7",
            },
            text: {
              value:
                "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6575-0",
                  },
                  display: {
                    value: "Very difficult",
                  },
                },
              },
            ],
          },
        ],
        id: {
          value: "1449318",
        },
        meta: {
          versionId: {
            value: "1",
          },
          lastUpdated: {
            value: "2023-01-13T13:28:13.856-05:00",
          },
        },
      },
      {
        questionnaire: {
          value: "Questionnaire/CIRG-PHQ9",
        },
        status: {
          value: "completed",
        },
        subject: {
          reference: {
            value: "Patient/5ee05359-57bf-4cee-8e89-91382c07e162",
          },
        },
        authored: {
          value: "2022-05-12",
        },
        author: {
          reference: {
            value: "Practitioner/52919099-6a7a-442c-b0d5-2b02c0dd4b74",
          },
        },
        item: [
          {
            linkId: {
              value: "/44261-6",
            },
            text: {
              value: "Patient health questionnaire 9 item total score",
            },
            answer: [
              {
                value: {
                  value: 23,
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44250-9",
            },
            text: {
              value: "Little interest or pleasure in doing things",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6571-9",
                  },
                  display: {
                    value: "Nearly every day",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44255-8",
            },
            text: {
              value: "Feeling down, depressed, or hopeless",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44259-0",
            },
            text: {
              value: "Trouble falling or staying asleep, or sleeping too much",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44254-1",
            },
            text: {
              value: "Feeling tired or having little energy",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44251-7",
            },
            text: {
              value: "Poor appetite or overeating",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44258-2",
            },
            text: {
              value:
                "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44252-5",
            },
            text: {
              value:
                "Trouble concentrating on things, such as reading the newspaper or watching television",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44253-3",
            },
            text: {
              value:
                "Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44260-8",
            },
            text: {
              value:
                "Thoughts that you would be better off dead, or of hurting yourself in some way",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6571-9",
                  },
                  display: {
                    value: "Nearly every day",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69722-7",
            },
            text: {
              value:
                "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6575-0",
                  },
                  display: {
                    value: "Very difficult",
                  },
                },
              },
            ],
          },
        ],
        id: {
          value: "1449319",
        },
        meta: {
          versionId: {
            value: "1",
          },
          lastUpdated: {
            value: "2023-01-13T13:28:21.891-05:00",
          },
        },
      },
    ],
    CurrentQuestionnaireResponse: {
      questionnaire: {
        value: "Questionnaire/CIRG-PHQ9",
      },
      status: {
        value: "completed",
      },
      subject: {
        reference: {
          value: "Patient/5ee05359-57bf-4cee-8e89-91382c07e162",
        },
      },
      authored: {
        value: "2023-01-04",
      },
      author: {
        reference: {
          value: "Practitioner/52919099-6a7a-442c-b0d5-2b02c0dd4b74",
        },
      },
      item: [
        {
          linkId: {
            value: "/44261-6",
          },
          text: {
            value: "Patient health questionnaire 9 item total score",
          },
          answer: [
            {
              value: {
                value: 23,
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44250-9",
          },
          text: {
            value: "Little interest or pleasure in doing things",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44255-8",
          },
          text: {
            value: "Feeling down, depressed, or hopeless",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44259-0",
          },
          text: {
            value: "Trouble falling or staying asleep, or sleeping too much",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44254-1",
          },
          text: {
            value: "Feeling tired or having little energy",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44251-7",
          },
          text: {
            value: "Poor appetite or overeating",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44258-2",
          },
          text: {
            value:
              "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44252-5",
          },
          text: {
            value:
              "Trouble concentrating on things, such as reading the newspaper or watching television",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44253-3",
          },
          text: {
            value:
              "Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/44260-8",
          },
          text: {
            value:
              "Thoughts that you would be better off dead, or of hurting yourself in some way",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/69722-7",
          },
          text: {
            value:
              "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6575-0",
                },
                display: {
                  value: "Very difficult",
                },
              },
            },
          ],
        },
      ],
      id: {
        value: "1449318",
      },
      meta: {
        versionId: {
          value: "1",
        },
        lastUpdated: {
          value: "2023-01-13T13:28:13.856-05:00",
        },
      },
    },
    CurrentResponseItems: [
      {
        linkId: {
          value: "/44261-6",
        },
        text: {
          value: "Patient health questionnaire 9 item total score",
        },
        answer: [
          {
            value: {
              value: 23,
            },
          },
        ],
      },
      {
        linkId: {
          value: "/44250-9",
        },
        text: {
          value: "Little interest or pleasure in doing things",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6571-9",
              },
              display: {
                value: "Nearly every day",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/44255-8",
        },
        text: {
          value: "Feeling down, depressed, or hopeless",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6571-9",
              },
              display: {
                value: "Nearly every day",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/44259-0",
        },
        text: {
          value: "Trouble falling or staying asleep, or sleeping too much",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6570-1",
              },
              display: {
                value: "More than half the days",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/44254-1",
        },
        text: {
          value: "Feeling tired or having little energy",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6570-1",
              },
              display: {
                value: "More than half the days",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/44251-7",
        },
        text: {
          value: "Poor appetite or overeating",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6570-1",
              },
              display: {
                value: "More than half the days",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/44258-2",
        },
        text: {
          value:
            "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6570-1",
              },
              display: {
                value: "More than half the days",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/44252-5",
        },
        text: {
          value:
            "Trouble concentrating on things, such as reading the newspaper or watching television",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6570-1",
              },
              display: {
                value: "More than half the days",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/44253-3",
        },
        text: {
          value:
            "Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6570-1",
              },
              display: {
                value: "More than half the days",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/44260-8",
        },
        text: {
          value:
            "Thoughts that you would be better off dead, or of hurting yourself in some way",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6571-9",
              },
              display: {
                value: "Nearly every day",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/69722-7",
        },
        text: {
          value:
            "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6575-0",
              },
              display: {
                value: "Very difficult",
              },
            },
          },
        ],
      },
    ],
    Phq9ScoreQuestion1: 3,
    Phq9ScoreQuestion2: 3,
    Phq9ScoreQuestion3: 2,
    Phq9ScoreQuestion4: 2,
    Phq9ScoreQuestion5: 2,
    Phq9ScoreQuestion6: 2,
    Phq9ScoreQuestion7: 2,
    Phq9ScoreQuestion8: 2,
    Phq9ScoreQuestion9: 3,
    Phq9ScoreQuestion10: 2,
    FullScore: 23,
    ResponsesSummary: [
      {
        id: "1449318",
        date: "2023-01-04",
        items: [
          {
            linkId: {
              value: "/44261-6",
            },
            text: {
              value: "Patient health questionnaire 9 item total score",
            },
            answer: [
              {
                value: {
                  value: 23,
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44250-9",
            },
            text: {
              value: "Little interest or pleasure in doing things",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6571-9",
                  },
                  display: {
                    value: "Nearly every day",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44255-8",
            },
            text: {
              value: "Feeling down, depressed, or hopeless",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6571-9",
                  },
                  display: {
                    value: "Nearly every day",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44259-0",
            },
            text: {
              value: "Trouble falling or staying asleep, or sleeping too much",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44254-1",
            },
            text: {
              value: "Feeling tired or having little energy",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44251-7",
            },
            text: {
              value: "Poor appetite or overeating",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44258-2",
            },
            text: {
              value:
                "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44252-5",
            },
            text: {
              value:
                "Trouble concentrating on things, such as reading the newspaper or watching television",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44253-3",
            },
            text: {
              value:
                "Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44260-8",
            },
            text: {
              value:
                "Thoughts that you would be better off dead, or of hurting yourself in some way",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6571-9",
                  },
                  display: {
                    value: "Nearly every day",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69722-7",
            },
            text: {
              value:
                "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6575-0",
                  },
                  display: {
                    value: "Very difficult",
                  },
                },
              },
            ],
          },
        ],
        responses: [
          {
            linkId: "/44250-9",
            question: "Little interest or pleasure in doing things",
            answer: "Nearly every day",
          },
          {
            linkId: "/44255-8",
            question: "Feeling down, depressed, or hopeless",
            answer: "Nearly every day",
          },
          {
            linkId: "/44259-0",
            question: "Trouble falling or staying asleep, or sleeping too much",
            answer: "More than half the days",
          },
          {
            linkId: "/44254-1",
            question: "Feeling tired or having little energy",
            answer: "More than half the days",
          },
          {
            linkId: "/44251-7",
            question: "Poor appetite or overeating",
            answer: "More than half the days",
          },
          {
            linkId: "/44258-2",
            question:
              "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
            answer: "More than half the days",
          },
          {
            linkId: "/44252-5",
            question:
              "Trouble concentrating on things, such as reading the newspaper or watching television",
            answer: "More than half the days",
          },
          {
            linkId: "/44253-3",
            question:
              "Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual",
            answer: "More than half the days",
          },
          {
            linkId: "/44260-8",
            question:
              "Thoughts that you would be better off dead, or of hurting yourself in some way",
            answer: "Nearly every day",
          },
          {
            linkId: "/69722-7",
            question:
              "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
            answer: "Very difficult",
          },
        ],
        score: 23,
        scoreSeverity: "high",
        authoredDate: {
          value: "2023-01-04",
        },
        lastUpdated: "2023-01-13T13:28:13.856-05:00",
        qid: "phq9",
      },
      {
        id: "1449319",
        date: "2022-05-12",
        items: [
          {
            linkId: {
              value: "/44261-6",
            },
            text: {
              value: "Patient health questionnaire 9 item total score",
            },
            answer: [
              {
                value: {
                  value: 23,
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44250-9",
            },
            text: {
              value: "Little interest or pleasure in doing things",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6571-9",
                  },
                  display: {
                    value: "Nearly every day",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44255-8",
            },
            text: {
              value: "Feeling down, depressed, or hopeless",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44259-0",
            },
            text: {
              value: "Trouble falling or staying asleep, or sleeping too much",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44254-1",
            },
            text: {
              value: "Feeling tired or having little energy",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44251-7",
            },
            text: {
              value: "Poor appetite or overeating",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44258-2",
            },
            text: {
              value:
                "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44252-5",
            },
            text: {
              value:
                "Trouble concentrating on things, such as reading the newspaper or watching television",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44253-3",
            },
            text: {
              value:
                "Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/44260-8",
            },
            text: {
              value:
                "Thoughts that you would be better off dead, or of hurting yourself in some way",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6571-9",
                  },
                  display: {
                    value: "Nearly every day",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69722-7",
            },
            text: {
              value:
                "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6575-0",
                  },
                  display: {
                    value: "Very difficult",
                  },
                },
              },
            ],
          },
        ],
        responses: [
          {
            linkId: "/44250-9",
            question: "Little interest or pleasure in doing things",
            answer: "Nearly every day",
          },
          {
            linkId: "/44255-8",
            question: "Feeling down, depressed, or hopeless",
            answer: "More than half the days",
          },
          {
            linkId: "/44259-0",
            question: "Trouble falling or staying asleep, or sleeping too much",
            answer: "More than half the days",
          },
          {
            linkId: "/44254-1",
            question: "Feeling tired or having little energy",
            answer: "More than half the days",
          },
          {
            linkId: "/44251-7",
            question: "Poor appetite or overeating",
            answer: "More than half the days",
          },
          {
            linkId: "/44258-2",
            question:
              "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
            answer: "More than half the days",
          },
          {
            linkId: "/44252-5",
            question:
              "Trouble concentrating on things, such as reading the newspaper or watching television",
            answer: "More than half the days",
          },
          {
            linkId: "/44253-3",
            question:
              "Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual",
            answer: "More than half the days",
          },
          {
            linkId: "/44260-8",
            question:
              "Thoughts that you would be better off dead, or of hurting yourself in some way",
            answer: "Nearly every day",
          },
          {
            linkId: "/69722-7",
            question:
              "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
            answer: "Very difficult",
          },
        ],
        score: 22,
        scoreSeverity: "high",
        authoredDate: {
          value: "2022-05-12",
        },
        lastUpdated: "2023-01-13T13:28:21.891-05:00",
        qid: "phq9",
      },
    ],
    dataKey: "phq9",
  },
  {
    QuestionnaireName: "gad7",
    QuestionnaireURL: "http://www.cdc.gov/ncbddd/fasd/gad7",
    question1LinkId: "/69725-0",
    question2LinkId: "/68509-9",
    question3LinkId: "/69733-4",
    question4LinkId: "/69734-2",
    question5LinkId: "/69735-9",
    question6LinkId: "/69689-8",
    question7LinkId: "/69736-7",
    ScoringQuestionId: "/70274-6",
    answerExtensionIndex: 1,
    ScoreParams: {
      minScore: 0,
      maxScore: 21,
    },
    Patient: {
      identifier: [
        {
          system: {
            value: "https://github.com/synthetichealth/synthea",
          },
          value: {
            value: "3f228315-d2de-4292-a56a-b7c120c2875d",
          },
        },
        {
          type: {
            coding: [
              {
                system: {
                  value: "http://terminology.hl7.org/CodeSystem/v2-0203",
                },
                code: {
                  value: "MR",
                },
                display: {
                  value: "Medical Record Number",
                },
              },
            ],
            text: {
              value: "Medical Record Number",
            },
          },
          system: {
            value: "http://hospital.smarthealthit.org",
          },
          value: {
            value: "3f228315-d2de-4292-a56a-b7c120c2875d",
          },
        },
        {
          type: {
            coding: [
              {
                system: {
                  value: "http://terminology.hl7.org/CodeSystem/v2-0203",
                },
                code: {
                  value: "SS",
                },
                display: {
                  value: "Social Security Number",
                },
              },
            ],
            text: {
              value: "Social Security Number",
            },
          },
          system: {
            value: "http://hl7.org/fhir/sid/us-ssn",
          },
          value: {
            value: "999-58-3251",
          },
        },
        {
          type: {
            coding: [
              {
                system: {
                  value: "http://terminology.hl7.org/CodeSystem/v2-0203",
                },
                code: {
                  value: "DL",
                },
                display: {
                  value: "Driver's License",
                },
              },
            ],
            text: {
              value: "Driver's License",
            },
          },
          system: {
            value: "urn:oid:2.16.840.1.113883.4.3.25",
          },
          value: {
            value: "S99913820",
          },
        },
        {
          type: {
            coding: [
              {
                system: {
                  value: "http://terminology.hl7.org/CodeSystem/v2-0203",
                },
                code: {
                  value: "PPN",
                },
                display: {
                  value: "Passport Number",
                },
              },
            ],
            text: {
              value: "Passport Number",
            },
          },
          system: {
            value:
              "http://standardhealthrecord.org/fhir/StructureDefinition/passportNumber",
          },
          value: {
            value: "X50228204X",
          },
        },
      ],
      name: [
        {
          use: {
            value: "official",
          },
          family: {
            value: "Abbott",
          },
          given: [
            {
              value: "Barney",
            },
          ],
          prefix: [
            {
              value: "Mr.",
            },
          ],
        },
      ],
      telecom: [
        {
          system: {
            value: "phone",
          },
          value: {
            value: "555-901-9296",
          },
          use: {
            value: "home",
          },
        },
      ],
      gender: {
        value: "male",
      },
      birthDate: {
        value: "1964-03-18",
      },
      deceased: {
        value: "1989-02-15T08:54:18+00:00",
      },
      address: [
        {
          line: [
            {
              value: "440 Russel Common Apt 7",
            },
          ],
          city: {
            value: "Framingham",
          },
          state: {
            value: "Massachusetts",
          },
          postalCode: {
            value: "01701",
          },
          country: {
            value: "US",
          },
          extension: [
            {
              url: "http://hl7.org/fhir/StructureDefinition/geolocation",
              extension: [
                {
                  url: "latitude",
                  value: {
                    value: 42.307905,
                  },
                },
                {
                  url: "longitude",
                  value: {
                    value: -71.436196,
                  },
                },
              ],
            },
          ],
        },
      ],
      maritalStatus: {
        coding: [
          {
            system: {
              value: "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
            },
            code: {
              value: "S",
            },
            display: {
              value: "Never Married",
            },
          },
        ],
        text: {
          value: "Never Married",
        },
      },
      multipleBirth: {
        value: false,
      },
      communication: [
        {
          language: {
            coding: [
              {
                system: {
                  value: "urn:ietf:bcp:47",
                },
                code: {
                  value: "en-US",
                },
                display: {
                  value: "English",
                },
              },
            ],
            text: {
              value: "English",
            },
          },
        },
      ],
      text: {
        status: {
          value: "generated",
        },
      },
      extension: [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
          extension: [
            {
              url: "ombCategory",
              value: {
                system: {
                  value: "urn:oid:2.16.840.1.113883.6.238",
                },
                code: {
                  value: "2106-3",
                },
                display: {
                  value: "White",
                },
              },
            },
            {
              url: "text",
              value: {
                value: "White",
              },
            },
          ],
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          extension: [
            {
              url: "ombCategory",
              value: {
                system: {
                  value: "urn:oid:2.16.840.1.113883.6.238",
                },
                code: {
                  value: "2186-5",
                },
                display: {
                  value: "Not Hispanic or Latino",
                },
              },
            },
            {
              url: "text",
              value: {
                value: "Not Hispanic or Latino",
              },
            },
          ],
        },
        {
          url: "http://hl7.org/fhir/StructureDefinition/patient-mothersMaidenName",
          value: {
            value: "Luise Grant",
          },
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
          value: {
            value: "M",
          },
        },
        {
          url: "http://hl7.org/fhir/StructureDefinition/patient-birthPlace",
          value: {
            city: {
              value: "Lee",
            },
            state: {
              value: "Massachusetts",
            },
            country: {
              value: "US",
            },
          },
        },
        {
          url: "http://synthetichealth.github.io/synthea/disability-adjusted-life-years",
          value: {
            value: 0.3868990459023335,
          },
        },
        {
          url: "http://synthetichealth.github.io/synthea/quality-adjusted-life-years",
          value: {
            value: 23.613100954097668,
          },
        },
      ],
      id: {
        value: "5ee05359-57bf-4cee-8e89-91382c07e162",
      },
      meta: {
        versionId: {
          value: "33",
        },
        lastUpdated: {
          value: "2022-07-27T03:07:06.020-04:00",
        },
        tag: [
          {
            system: {
              value: "https://smarthealthit.org/tags",
            },
            code: {
              value: "synthea-5-2019",
            },
          },
        ],
      },
    },
    CurrentQuestionnaireURL: "http://www.cdc.gov/ncbddd/fasd/gad7",
    Gad7Questionnaire: {
      name: {
        value: "GAD7",
      },
      title: {
        value: "Generalized anxiety disorder 7 item (GAD-7)",
      },
      status: {
        value: "draft",
      },
      code: [
        {
          code: {
            value: "69737-5",
          },
          display: {
            value: "Generalized anxiety disorder 7 item (GAD-7)",
          },
        },
      ],
      item: [
        {
          linkId: {
            value: "introduction",
          },
          text: {
            extension: [
              {
                url: "http://hl7.org/fhir/StructureDefinition/rendering-xhtml",
                value: {
                  value:
                    "<p style='font-size:1.3em'>The <b>Generalized Anxiety Disorder Assessment</b> (GAD-7) is a seven-item instrument that is used to measure or assess the severity of generalized anxiety disorder (GAD). Each item asks the individual to rate the severity of his or her symptoms over the past two weeks.</br></br>These questions are to be answered by the <b>patient</b>.</p>",
                },
              },
            ],
          },
          type: {
            value: "display",
          },
        },
        {
          linkId: {
            value: "/69725-0",
          },
          code: [
            {
              code: {
                value: "69725-0",
              },
              display: {
                value: "Feeling nervous, anxious or on edge",
              },
            },
          ],
          text: {
            value: "Feeling nervous, anxious or on edge",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
              ],
            },
          ],
        },
        {
          linkId: {
            value: "/68509-9",
          },
          code: [
            {
              code: {
                value: "68509-9",
              },
              display: {
                value:
                  "Over the past 2 weeks have you not been able to stop or control worrying",
              },
            },
          ],
          text: {
            value:
              "Over the past 2 weeks have you not been able to stop or control worrying",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA18938-3",
                },
                display: {
                  value: "More days than not",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
              ],
            },
          ],
        },
        {
          linkId: {
            value: "/69733-4",
          },
          code: [
            {
              code: {
                value: "69733-4",
              },
              display: {
                value: "Worrying too much about different things",
              },
            },
          ],
          text: {
            value: "Worrying too much about different things",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
              ],
            },
          ],
        },
        {
          linkId: {
            value: "/69734-2",
          },
          code: [
            {
              code: {
                value: "69734-2",
              },
              display: {
                value: "Trouble relaxing",
              },
            },
          ],
          text: {
            value: "Trouble relaxing",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
              ],
            },
          ],
        },
        {
          linkId: {
            value: "/69735-9",
          },
          code: [
            {
              code: {
                value: "69735-9",
              },
              display: {
                value: "Being so restless that it is hard to sit still",
              },
            },
          ],
          text: {
            value: "Being so restless that it is hard to sit still",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
              ],
            },
          ],
        },
        {
          linkId: {
            value: "/69689-8",
          },
          code: [
            {
              code: {
                value: "69689-8",
              },
              display: {
                value: "Becoming easily annoyed or irritable.",
              },
            },
          ],
          text: {
            value: "Becoming easily annoyed or irritable.",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
              ],
            },
          ],
        },
        {
          linkId: {
            value: "/69736-7",
          },
          code: [
            {
              code: {
                value: "69736-7",
              },
              display: {
                value: "Feeling afraid as if something awful might happen",
              },
            },
          ],
          text: {
            value: "Feeling afraid as if something awful might happen",
          },
          type: {
            value: "choice",
          },
          required: {
            value: false,
          },
          answerOption: [
            {
              value: {
                code: {
                  value: "LA6568-5",
                },
                display: {
                  value: "Not at all",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "0",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 0,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "1",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 1,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "2",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 2,
                  },
                },
              ],
            },
            {
              value: {
                code: {
                  value: "LA6571-9",
                },
                display: {
                  value: "Nearly every day",
                },
              },
              extension: [
                {
                  url: "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                  value: {
                    value: "3",
                  },
                },
                {
                  url: "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                  value: {
                    value: 3,
                  },
                },
              ],
            },
          ],
        },
        {
          linkId: {
            value: "/70274-6",
          },
          code: [
            {
              code: {
                value: "70274-6",
              },
              display: {
                value: "Generalized anxiety disorder 7 item total score",
              },
            },
          ],
          text: {
            value: "Generalized anxiety disorder 7 item total score",
          },
          type: {
            value: "decimal",
          },
          required: {
            value: false,
          },
          extension: [
            {
              url: "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression",
              value: {
                language: {
                  value: "text/cql",
                },
                expression: {
                  value: "DisplayScoreFullGad7",
                },
                reference: {
                  value: "#GAD7LogicLibrary|1.0",
                },
              },
            },
            {
              url: "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression",
              value: {
                language: {
                  value: "text/cql",
                },
                expression: {
                  value: "ScoreFullGad7",
                },
                reference: {
                  value: "#GAD7LogicLibrary|1.0",
                },
              },
            },
          ],
        },
      ],
      id: {
        value: "CIRG-GAD7",
      },
      meta: {
        versionId: {
          value: "115",
        },
        lastUpdated: {
          value: "2023-01-13T15:54:04.903-05:00",
        },
        profile: [
          {
            value:
              "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire|2.7",
          },
        ],
        tag: [
          {
            code: {
              value: "lformsVersion: 32.0.0",
            },
          },
        ],
      },
    },
    IndexOfQuestion: {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
    },
    QuestionnaireResponses: [
      {
        questionnaire: {
          value: "Questionnaire/CIRG-GAD7",
        },
        status: {
          value: "completed",
        },
        subject: {
          reference: {
            value: "Patient/5ee05359-57bf-4cee-8e89-91382c07e162",
          },
        },
        authored: {
          value: "2021-12-24",
        },
        author: {
          reference: {
            value: "Practitioner/52919099-6a7a-442c-b0d5-2b02c0dd4b74",
          },
        },
        item: [
          {
            linkId: {
              value: "/70274-6",
            },
            text: {
              value: "Generalized anxiety disorder 7 item total score",
            },
            answer: [
              {
                value: {
                  value: 5,
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69725-0",
            },
            text: {
              value: "Feeling nervous, anxious or on edge",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/68509-9",
            },
            text: {
              value:
                "Over the past 2 weeks have you not been able to stop or control worrying",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69734-2",
            },
            text: {
              value: "Trouble relaxing",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69689-8",
            },
            text: {
              value: "Becoming easily annoyed or irritable.",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69736-7",
            },
            text: {
              value: "Feeling afraid as if something awful might happen",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
        ],
        id: {
          value: "1449316",
        },
        meta: {
          versionId: {
            value: "1",
          },
          lastUpdated: {
            value: "2023-01-13T12:07:17.284-05:00",
          },
        },
      },
      {
        questionnaire: {
          value: "Questionnaire/CIRG-GAD7",
        },
        status: {
          value: "completed",
        },
        subject: {
          reference: {
            value: "Patient/5ee05359-57bf-4cee-8e89-91382c07e162",
          },
        },
        authored: {
          value: "2023-01-06",
        },
        item: [
          {
            linkId: {
              value: "/70274-6",
            },
            text: {
              value: "Generalized anxiety disorder 7 item total score",
            },
            answer: [
              {
                value: {
                  value: 11,
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69725-0",
            },
            text: {
              value: "Feeling nervous, anxious or on edge",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/68509-9",
            },
            text: {
              value:
                "Over the past 2 weeks have you not been able to stop or control worrying",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6568-5",
                  },
                  display: {
                    value: "Not at all",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69733-4",
            },
            text: {
              value: "Worrying too much about different things",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6568-5",
                  },
                  display: {
                    value: "Not at all",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69734-2",
            },
            text: {
              value: "Trouble relaxing",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69735-9",
            },
            text: {
              value: "Being so restless that it is hard to sit still",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6568-5",
                  },
                  display: {
                    value: "Not at all",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69689-8",
            },
            text: {
              value: "Becoming easily annoyed or irritable.",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6568-5",
                  },
                  display: {
                    value: "Not at all",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69736-7",
            },
            text: {
              value: "Feeling afraid as if something awful might happen",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6568-5",
                  },
                  display: {
                    value: "Not at all",
                  },
                },
              },
            ],
          },
        ],
        id: {
          value: "1449317",
        },
        meta: {
          versionId: {
            value: "1",
          },
          lastUpdated: {
            value: "2023-01-13T13:28:02.897-05:00",
          },
        },
      },
      {
        questionnaire: {
          value: "Questionnaire/CIRG-GAD7",
        },
        status: {
          value: "completed",
        },
        subject: {
          reference: {
            value: "Patient/5ee05359-57bf-4cee-8e89-91382c07e162",
          },
        },
        authored: {
          value: "2020-03-12",
        },
        author: {
          reference: {
            value: "Practitioner/52919099-6a7a-442c-b0d5-2b02c0dd4b74",
          },
        },
        item: [
          {
            linkId: {
              value: "/70274-6",
            },
            text: {
              value: "Generalized anxiety disorder 7 item total score",
            },
            answer: [
              {
                value: {
                  value: 5,
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69725-0",
            },
            text: {
              value: "Feeling nervous, anxious or on edge",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/68509-9",
            },
            text: {
              value:
                "Over the past 2 weeks have you not been able to stop or control worrying",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69734-2",
            },
            text: {
              value: "Trouble relaxing",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69689-8",
            },
            text: {
              value: "Becoming easily annoyed or irritable.",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69736-7",
            },
            text: {
              value: "Feeling afraid as if something awful might happen",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69735-9",
            },
            text: {
              value: "Being so restless that it is hard to sit still",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
        ],
        id: {
          value: "1449320",
        },
        meta: {
          versionId: {
            value: "1",
          },
          lastUpdated: {
            value: "2023-01-13T13:54:26.818-05:00",
          },
        },
      },
    ],
    CurrentQuestionnaireResponse: {
      questionnaire: {
        value: "Questionnaire/CIRG-GAD7",
      },
      status: {
        value: "completed",
      },
      subject: {
        reference: {
          value: "Patient/5ee05359-57bf-4cee-8e89-91382c07e162",
        },
      },
      authored: {
        value: "2021-12-24",
      },
      author: {
        reference: {
          value: "Practitioner/52919099-6a7a-442c-b0d5-2b02c0dd4b74",
        },
      },
      item: [
        {
          linkId: {
            value: "/70274-6",
          },
          text: {
            value: "Generalized anxiety disorder 7 item total score",
          },
          answer: [
            {
              value: {
                value: 5,
              },
            },
          ],
        },
        {
          linkId: {
            value: "/69725-0",
          },
          text: {
            value: "Feeling nervous, anxious or on edge",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/68509-9",
          },
          text: {
            value:
              "Over the past 2 weeks have you not been able to stop or control worrying",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/69734-2",
          },
          text: {
            value: "Trouble relaxing",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6569-3",
                },
                display: {
                  value: "Several days",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/69689-8",
          },
          text: {
            value: "Becoming easily annoyed or irritable.",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
            },
          ],
        },
        {
          linkId: {
            value: "/69736-7",
          },
          text: {
            value: "Feeling afraid as if something awful might happen",
          },
          answer: [
            {
              value: {
                code: {
                  value: "LA6570-1",
                },
                display: {
                  value: "More than half the days",
                },
              },
            },
          ],
        },
      ],
      id: {
        value: "1449316",
      },
      meta: {
        versionId: {
          value: "1",
        },
        lastUpdated: {
          value: "2023-01-13T12:07:17.284-05:00",
        },
      },
    },
    CurrentResponseItems: [
      {
        linkId: {
          value: "/70274-6",
        },
        text: {
          value: "Generalized anxiety disorder 7 item total score",
        },
        answer: [
          {
            value: {
              value: 5,
            },
          },
        ],
      },
      {
        linkId: {
          value: "/69725-0",
        },
        text: {
          value: "Feeling nervous, anxious or on edge",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6569-3",
              },
              display: {
                value: "Several days",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/68509-9",
        },
        text: {
          value:
            "Over the past 2 weeks have you not been able to stop or control worrying",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6569-3",
              },
              display: {
                value: "Several days",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/69734-2",
        },
        text: {
          value: "Trouble relaxing",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6569-3",
              },
              display: {
                value: "Several days",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/69689-8",
        },
        text: {
          value: "Becoming easily annoyed or irritable.",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6570-1",
              },
              display: {
                value: "More than half the days",
              },
            },
          },
        ],
      },
      {
        linkId: {
          value: "/69736-7",
        },
        text: {
          value: "Feeling afraid as if something awful might happen",
        },
        answer: [
          {
            value: {
              code: {
                value: "LA6570-1",
              },
              display: {
                value: "More than half the days",
              },
            },
          },
        ],
      },
    ],
    Gad7ScoreQuestion1: 1,
    Gad7ScoreQuestion2: 1,
    Gad7ScoreQuestion3: 0,
    Gad7ScoreQuestion4: 1,
    Gad7ScoreQuestion5: 0,
    Gad7ScoreQuestion6: 2,
    Gad7ScoreQuestion7: 2,
    FullScore: 7,
    ResponsesSummary: [
      {
        id: "1449317",
        date: "2023-01-06",
        items: [
          {
            linkId: {
              value: "/70274-6",
            },
            text: {
              value: "Generalized anxiety disorder 7 item total score",
            },
            answer: [
              {
                value: {
                  value: 11,
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69725-0",
            },
            text: {
              value: "Feeling nervous, anxious or on edge",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/68509-9",
            },
            text: {
              value:
                "Over the past 2 weeks have you not been able to stop or control worrying",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6568-5",
                  },
                  display: {
                    value: "Not at all",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69733-4",
            },
            text: {
              value: "Worrying too much about different things",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6568-5",
                  },
                  display: {
                    value: "Not at all",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69734-2",
            },
            text: {
              value: "Trouble relaxing",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69735-9",
            },
            text: {
              value: "Being so restless that it is hard to sit still",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6568-5",
                  },
                  display: {
                    value: "Not at all",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69689-8",
            },
            text: {
              value: "Becoming easily annoyed or irritable.",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6568-5",
                  },
                  display: {
                    value: "Not at all",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69736-7",
            },
            text: {
              value: "Feeling afraid as if something awful might happen",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6568-5",
                  },
                  display: {
                    value: "Not at all",
                  },
                },
              },
            ],
          },
        ],
        responses: [
          {
            linkId: "/69725-0",
            question: "Feeling nervous, anxious or on edge",
            answer: "More than half the days",
          },
          {
            linkId: "/68509-9",
            question:
              "Over the past 2 weeks have you not been able to stop or control worrying",
            answer: "Not at all",
          },
          {
            linkId: "/69733-4",
            question: "Worrying too much about different things",
            answer: "Not at all",
          },
          {
            linkId: "/69734-2",
            question: "Trouble relaxing",
            answer: "Several days",
          },
          {
            linkId: "/69735-9",
            question: "Being so restless that it is hard to sit still",
            answer: "Not at all",
          },
          {
            linkId: "/69689-8",
            question: "Becoming easily annoyed or irritable.",
            answer: "Not at all",
          },
          {
            linkId: "/69736-7",
            question: "Feeling afraid as if something awful might happen",
            answer: "Not at all",
          },
        ],
        score: 3,
        scoreSeverity: "low",
        authoredDate: {
          value: "2023-01-06",
        },
        lastUpdated: "2023-01-13T13:28:02.897-05:00",
        qid: "gad7",
      },
      {
        id: "1449316",
        date: "2021-12-24",
        items: [
          {
            linkId: {
              value: "/70274-6",
            },
            text: {
              value: "Generalized anxiety disorder 7 item total score",
            },
            answer: [
              {
                value: {
                  value: 5,
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69725-0",
            },
            text: {
              value: "Feeling nervous, anxious or on edge",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/68509-9",
            },
            text: {
              value:
                "Over the past 2 weeks have you not been able to stop or control worrying",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69734-2",
            },
            text: {
              value: "Trouble relaxing",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69689-8",
            },
            text: {
              value: "Becoming easily annoyed or irritable.",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69736-7",
            },
            text: {
              value: "Feeling afraid as if something awful might happen",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6570-1",
                  },
                  display: {
                    value: "More than half the days",
                  },
                },
              },
            ],
          },
        ],
        responses: [
          {
            linkId: "/69725-0",
            question: "Feeling nervous, anxious or on edge",
            answer: "Several days",
          },
          {
            linkId: "/68509-9",
            question:
              "Over the past 2 weeks have you not been able to stop or control worrying",
            answer: "Several days",
          },
          {
            linkId: "/69733-4",
            question: "Worrying too much about different things",
            answer: null,
          },
          {
            linkId: "/69734-2",
            question: "Trouble relaxing",
            answer: "Several days",
          },
          {
            linkId: "/69735-9",
            question: "Being so restless that it is hard to sit still",
            answer: null,
          },
          {
            linkId: "/69689-8",
            question: "Becoming easily annoyed or irritable.",
            answer: "More than half the days",
          },
          {
            linkId: "/69736-7",
            question: "Feeling afraid as if something awful might happen",
            answer: "More than half the days",
          },
        ],
        score: 7,
        scoreSeverity: "mild",
        authoredDate: {
          value: "2021-12-24",
        },
        lastUpdated: "2023-01-13T12:07:17.284-05:00",
        qid: "gad7",
      },
      {
        id: "1449320",
        date: "2020-03-12",
        items: [
          {
            linkId: {
              value: "/70274-6",
            },
            text: {
              value: "Generalized anxiety disorder 7 item total score",
            },
            answer: [
              {
                value: {
                  value: 5,
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69725-0",
            },
            text: {
              value: "Feeling nervous, anxious or on edge",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/68509-9",
            },
            text: {
              value:
                "Over the past 2 weeks have you not been able to stop or control worrying",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69734-2",
            },
            text: {
              value: "Trouble relaxing",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69689-8",
            },
            text: {
              value: "Becoming easily annoyed or irritable.",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69736-7",
            },
            text: {
              value: "Feeling afraid as if something awful might happen",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
          {
            linkId: {
              value: "/69735-9",
            },
            text: {
              value: "Being so restless that it is hard to sit still",
            },
            answer: [
              {
                value: {
                  code: {
                    value: "LA6569-3",
                  },
                  display: {
                    value: "Several days",
                  },
                },
              },
            ],
          },
        ],
        responses: [
          {
            linkId: "/69725-0",
            question: "Feeling nervous, anxious or on edge",
            answer: "Several days",
          },
          {
            linkId: "/68509-9",
            question:
              "Over the past 2 weeks have you not been able to stop or control worrying",
            answer: "Several days",
          },
          {
            linkId: "/69733-4",
            question: "Worrying too much about different things",
            answer: null,
          },
          {
            linkId: "/69734-2",
            question: "Trouble relaxing",
            answer: "Several days",
          },
          {
            linkId: "/69735-9",
            question: "Being so restless that it is hard to sit still",
            answer: "Several days",
          },
          {
            linkId: "/69689-8",
            question: "Becoming easily annoyed or irritable.",
            answer: "Several days",
          },
          {
            linkId: "/69736-7",
            question: "Feeling afraid as if something awful might happen",
            answer: "Several days",
          },
        ],
        score: 6,
        scoreSeverity: "mild",
        authoredDate: {
          value: "2020-03-12",
        },
        lastUpdated: "2023-01-13T13:54:26.818-05:00",
        qid: "gad7",
      },
    ],
    dataKey: "gad7",
  },
];
