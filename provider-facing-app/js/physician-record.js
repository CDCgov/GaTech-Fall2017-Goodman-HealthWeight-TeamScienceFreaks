/*global
Chart, GC, PointSet, Raphael, console, $,
jQuery, debugLog,
XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function(NS, $) 
{

    "use strict";
    var patientID = (window.sessionStorage.getItem('patientid_global')) ?
                window.sessionStorage.getItem('patientid_global') : "11034584";
    var fhir_url = window.sessionStorage.getItem('fhir_url_global')  + '/';

    var selectedIndex = -1,

        /**
         * The cached value from GC.App.getMetrics()
         */
        metrics = null,

        PRINT_MODE = $("html").is(".before-print"),

        EMPTY_MARK = PRINT_MODE ? "" : "&#8212;",

        MILISECOND = 1,
        SECOND     = MILISECOND * 1000,
        MINUTE     = SECOND * 60,
        HOUR       = MINUTE * 60,
        DAY        = HOUR * 24,
        WEEK       = DAY * 7,
        MONTH      = WEEK * 4.348214285714286,
        YEAR       = MONTH * 12,

        shortDateFormat = 
        {
            "Years"   : "y",
            "Year"    : "y",
            "Months"  : "m",
            "Month"   : "m",
            "Weeks"   : "w",
            "Week"    : "w",
            "Days"    : "d",
            "Day"     : "d",
            separator : " "
        };

    function isPhysicianGoalVisible()
    {
        return GC.App.getViewType() == "goal";
    }

    
var json_observation_data ={
                  "resourceType": "Observation",
                  "status": "final",
                  "code": {
                    "coding": [
                      {
                        "system": "http://loinc.org",
                        "code": "39156-5",
                        "display": "BMI"
                      }
                    ]
                  },
                  "subject": {
                    "reference": "Patient/" + patientID
                  },
                   "performer": [{
                      "display": "A. Langeveld"
                    }],
                  "issued": "2013-04-04T13:27:00+01:00", 
                  "effectiveDateTime": "2013-04-02",   
                  "valueQuantity": {
                    "value": 31.0
                  }
                };

        //this function can be used to POST notes the physician makes in the Observation input box on phys-record tab
        //json_observation_data is set up currently as a BMI observation but that should be changed
        //the physician notes should be placed in one (which one??) of the fields in the json struct
        var ObeseObservationsPOST = function (){
            var ObeseObservationsPOST = null;
             $.ajax({
                type: 'POST',
                async: false,
                global: false,
                url: fhir_url+'Observation',
                data: JSON.stringify(json_observation_data),
                dataType: 'json',
                contentType: 'application/json',
                success: function (data) {
                    ObeseObservationsPOST = data;
                    console.log( ObeseObservationsPOST);
                }
            });
            return ObeseObservationsPOST;
        };



        //Resource Condition   http://hl7.org/fhir/condition-examples.html
        //Use to record detailed information about conditions, problems or diagnoses recognized by a clinician.
        
        //childhood obesity snomed 415530009
        //http://phinvads.cdc.gov/vads/http:/phinvads.cdc.gov/vads/ViewCodeSystemConcept.action?oid=2.16.840.1.113883.6.96&code=415530009

        //"Problem"  55607006,  
        // SEVERITY  can be 3 levels:  24484000 Severe, 6736007 Moderate  , 255604002, Mild

        
        var json_condition_data = {
          "resourceType": "Condition",
          "patient": {
            "reference": "Patient/" + patientID
          },
          "asserter": {
            "display": "A. Langeveld"
          },
          "dateRecorded": "2013-03-11",
          "code": {
            "coding": [
              {
                "fhir_comments": [
                  "  The problem is Childhood obesity "
                ],
                "system": "http://snomed.info/sct",
                "code": "415530009",
                "display": "Childhood obesity"
              }
            ]
          },
          "category": {
            "coding": [
              {
                "fhir_comments": [
                  "  Childhood obesity is certainly a moderate to severe problem  "
                ],
                "system": "http://snomed.info/sct",
                "code": "55607006",
                "display": "Problem"
              },
              {
                "system": "http://hl7.org/fhir/condition-category",
                "code": "finding"
              }
            ]
          },
          "verificationStatus": "confirmed",
          "severity": {
            "coding": [
              {
                "system": "http://snomed.info/sct",
                "code": "6736007",
                "display": "Moderate"
              }
            ]
          },
          "onsetDateTime": "2013-03-08",
          "evidence": [
            {
              "detail": [
                {       
                  "display": "BMI"
                }
              ]
            }
          ]

        };

           
        //should be triggered by a button labled something like "POST Obesity diagnosis"
        var ObesityConditionPOST = function (){
             var ObesityConditionPOST = null;
                $.ajax({
                type: 'POST',
                async: false,
                global: false,
                url: fhir_url +'Condition',
                data: JSON.stringify(json_condition_data),
                dataType: 'json',
                contentType: 'application/json',
                success: function (data) {
                    ObesityConditionPOST = data;
                    console.log( ObesityConditionPOST);
                    alert(ObesityConditionPOST.issue[0].diagnostics);
                }
            });
            return ObesityConditionPOST;
        };



    // From: Goodman, Alyson B. (CDC/ONDIEH/NCCDPHP) 
    // Sent: Tuesday, April 26, 2016 5:17 PM
    // To: Pope, Tia M
    // Subject: lab testing for clinician facing app
     
    // Recommended Laboratory tests for children with obesity include:
     
    // Lipid panel (HDL-C, LDL-C, total cholesterol and triglycerides), fasting or non-fasting
    // Fasting or non-fasting blood glucose
    // ALT (alanine aminotransferase)
    // AST (aspartate aminotransferase)

    var json_order_diagnostic_tests_data ={  
       "resourceType":"DiagnosticOrder",
       "subject":{  
          "reference":"Patient/" + patientID
       },
       "orderer":{  
          "display":"A. Langeveld"
       },
       "identifier":[  
          {  
             "type":{  
                "coding":[  
                   {  
                      "system":"http://hl7.org/fhir/identifier-type",
                      "code":"PLAC"
                   }
                ],
                "text":"Placer"
             },
             "system":"urn:oid:1.3.4.5.6.7",
             "value":"2345234234234"
          }
       ],
       "reason":[  
          {  
             "coding":[  
                {  
                   "system":"http://snomed.info/sct",
                   "code":"415530009",
                   "display":"Childhood obesity"
                }
             ]
          }
       ],
       "supportingInformation":[  
          {  
             "reference":"#fasting"
          }
       ],
       "status":"requested",
       "event":[  
          {  
             "status":"requested",
             "dateTime":"2013-05-02T16:16:00-07:00",
             "actor":{  
                "display":"A. Langeveld"
             }
          }
       ],
       "note":[  
          {  
             "text":" This is a full set of tests"
          }
       ],
       "item":[  
          {  
             "code":{  
                "coding":[  
                   {  
                      "system":"http://loinc.org",
                      "code":"1556-0"
                   }
                ],
                "text":"Fasting glucose [Mass/volume] in Capillary blood"
             }
          },
          {  
             "code":{  
                "coding":[  
                   {  
                      "system":"http://loinc.org",
                      "code":"1742-6"
                   }
                ],
                "text":"Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma"
             }
          },
          {  
             "code":{  
                "coding":[  
                   {  
                      "system":"http://loinc.org",
                      "code":"1920-8"
                   }
                ],
                "text":"Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma"
             }
          },
          {  
             "code":{  
                "coding":[  
                   {  
                      "system":"http://loinc.org",
                      "code":"57698-3"
                   }
                ],
                "text":"Lipid panel with direct LDL - Serum or Plasma"
             }
          }
       ]
    };
      
       //used to order a full set of diagnostic tests 
       var DiagnosticOrderPOST = function (){
            var DiagnosticOrderPOST = null;
             $.ajax({
                type: 'POST',
                async: false,
                global: false,
                url: fhir_url +'DiagnosticOrder',
                data: JSON.stringify(json_order_diagnostic_tests_data),
                dataType: 'json',
                contentType: 'application/json',
                success: function (data) {
                    DiagnosticOrderPOST = data;
                    console.log( DiagnosticOrderPOST);
                    alert(DiagnosticOrderPOST.issue[0].diagnostics);
                }
            });
        };

    function renderPhysicianGoalForPrint(container) {
        var patientCall = (function () {
            var patientCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Patient?_id=' + patientID,
                dataType: 'json',
                success: function (data) {
                    patientCall = data;
                }
            });
            return patientCall;
        })();

        var GoalQuestionsID = window.sessionStorage.getItem('healthy_habits_goal_questions_id');
        var questionnaireResponseCall = (function () {
            var questionnaireResponseCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'QuestionnaireResponse?patient=' + patientID + "&questionnaire=" + GoalQuestionsID + "&_sort:desc=authored",
                dataType: 'json',
                success: function (data) {
                    questionnaireResponseCall = data;
                }
            });
            return questionnaireResponseCall;
        })();

        $.when(patientCall, questionnaireResponseCall).then(function() {
            var patient;
            if (patientCall.entry) {
                patient = patientCall.entry[0].resource;
            }
            var patientName = patient.name[0] ? patient.name[0].given[0] + " " + patient.name[0].family[0] : "";

            // TODO: pull this from HHG questionnaire
            var goalMap = {
                '1': 'Make half your plate fruits and veggies',
                '2': 'Be active',
                '3': 'Limit screen time',
                '4': 'Drink more water & limit sugary drinks'
            };
            var goalImgs = {'Make half your plate fruits and veggies': 'img/scrip/Veggies and Fruits.png',
                'Be active': 'img/scrip/Be Active.png',
                'Drink more water & limit sugary drinks': 'img/scrip/Limit Sugary Drinks.png',
                'Limit screen time': 'img/scrip/Limit Screen Time.png',
                'Other': 'img/scrip/Other.png'};

            var response = {};
            if (questionnaireResponseCall.entry) {
                response = questionnaireResponseCall.entry[0].resource;
            }
            var qr = {};
            for (var i in response["group"]["question"]) {
                if (response["group"]["question"].hasOwnProperty(i)) {
                    var questionResponse = response["group"]["question"][i];
                    if (questionResponse.hasOwnProperty("answer")) {
                        if (questionResponse["answer"][0].hasOwnProperty("valueString")) {
                            qr[questionResponse["linkId"]] = questionResponse["answer"][0]["valueString"];
                        } else if (questionResponse["answer"][0].hasOwnProperty("valueInteger")) {
                            qr[questionResponse["linkId"]] = questionResponse["answer"][0]["valueInteger"];
                        }
                    }
                }
            }
            var goalText = goalMap[qr["1"]]; // "Be active";
            var howText = qr["2"]; // "riding bikes together";
            var whenText = qr["3"]; // "every day";
            var howOftenText = qr["4"]; // "after school"
            var whoText = qr["5"]; // "my mom";
            var supportWhenText = qr["6"]; // "today, 7/21/16";
            var supportHowText = qr["7"]; // "be ready to ride at 4:30";
            $(container).empty();
            $(container).css({"padding": "20pt"});
            var headingContainer = $("<h3></h3>").html(patientName+"'s Healthy Habit Goal <img src='img/scrip/CHOA.png' style='float:right'/>")
                .css({"line-height":"74pt", "vertical-align":"center", "color": "#ff7010"});
            $(container).append(headingContainer);
            var goalContainer = $("<div></div>").css({"background-color": "#DDDDDD", "padding": "15pt", "text-align": "center"});
            for (var goal in goalImgs) {
                if (goalImgs.hasOwnProperty(goal)) {
                    var selectedGoal = (goal == goalText);
                    goalContainer.append("<img src='"+goalImgs[goal]+"' "+(selectedGoal?"class='active-goal' width='128'" : "width='96'")+ " style='padding:10pt' />");
                }
            }
            $(container).append(goalContainer);
            var scripText = "<br/><br/>I/we will <b>"+goalText+"</b> by <b>"+howText+"</b> <b>"+whenText+" "+howOftenText+"</b> with the help of <b>"+whoText+"</b>.";
            var scripTextContainer = $("<div></div>").html(scripText);
            $(container).append(scripTextContainer);
            var parentHeadingContainer = $("<h3></h3>").html("Parent/Family Goal")
                .css({"line-height":"74pt", "vertical-align":"center", "color": "#ff7010"});
            $(container).append(parentHeadingContainer);
            var parentText = "As of <b>"+supportWhenText+"</b>, I/we will <b>"+supportHowText+"</b>.";
            var parentTextContainer = $("<div></div>").html(parentText);
            $(container).append(parentTextContainer);
        });
    }


    function renderPhysicianGoal( container )
    {
        $(container).empty();
        var topContainer = $("<div></div>").addClass("row");
        topContainer.attr("id", "thePatient-div");
        $(container).append(topContainer);



        var patientCall = (function () {
            var patientCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Patient?_id=' + patientID,
                dataType: 'json',
                success: function (data) {
                    patientCall = data;
                }
            });
            return patientCall;
        })();

        var theSurvey = $("<div></div>").addClass("col-xs-8 col-xs-offset-1 content");
        theSurvey.attr("id", "theSurvey-div");
        $(container).append(theSurvey);
        var infoCallout = $("<div></div>").addClass("col-xs-2 sidebar-outer");
        infoCallout.attr("id", "familyInfo-div");
        $(container).append(infoCallout);

        var GoalQuestionsID = window.sessionStorage.getItem('healthy_habits_goal_questions_id');

        var questionnaireCall = (function () {
            var questionnaireCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Questionnaire?_id=' + GoalQuestionsID,
                dataType: 'json',
                success: function (data) {
                    questionnaireCall = data;
                }
            });
            return questionnaireCall;
        })();

        var patientBMICall = (function () {
            var patientBMICall = null;
            //refer to http://docs.smarthealthit.org/tutorials/server-quick-start/

            //Note LOINC Codes: 39156-5 for BMI Observations
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Observation?subject:Patient=' + patientID + '&code=39156-5&_count=50',
                dataType: 'json',
                success: function (data) {
                    patientBMICall = data;
                }
            });
            return patientBMICall;
        })();

        var patientWeightCall = (function () {
            var patientWeightCall = null;
            //refer to http://docs.smarthealthit.org/tutorials/server-quick-start/

            //Note LOINC Codes: 3141-9 for Weight Observations
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Observation?subject:Patient=' + patientID + '&code=3141-9&_count=50',
                dataType: 'json',
                success: function (data) {
                    patientWeightCall = data;
                }
            });
            return patientWeightCall;
        })();

        var patientHeightCall = (function () {
            var patientHeightCall = null;
            //refer to http://docs.smarthealthit.org/tutorials/server-quick-start/

            //Note LOINC Codes: 8302-2 for Height BMI Observations
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'Observation?subject:Patient=' + patientID + '&code=8302-2&_count=50',
                dataType: 'json',
                success: function (data) {
                    patientHeightCall = data;
                }
            });
            return patientHeightCall;
        })();

        var familyCall = (function () {
            var familyCall = null;

            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'RelatedPerson?patient=' + patientID,
                dataType: 'json',
                success: function (data) {
                    familyCall = data;
                }
            });
            return familyCall;
        })();

        $.when(patientCall, questionnaireCall, patientBMICall, patientWeightCall, patientHeightCall, familyCall).then(function() {

            if (patientCall.entry) {
                var patient = patientCall.entry[0].resource;
            }

            var patientId = (patient.id ? patient.id : "");
            var patientVersion = (patient.meta.versionId) ? patient.meta.versionId : "";
            var patientLastUpdated = patient.meta.lastUpdated ? patient.meta.lastUpdated : "";
            var patientName = patient.name[0] ? patient.name[0].given[0] + " " + patient.name[0].family[0] : "";
            var patientGender = patient.gender ? patient.gender : "";
            var patientBDay = patient.birthDate ? patient.birthDate : "";
            var address = (patient.address ?
            (patient.address[0].line ?
            patient.address[0].line + "</br>" : "") +
            (patient.address[0].city ?
            patient.address[0].city + ", " : "") +
            (patient.address[0].state ?
            patient.address[0].state + " " : "") +
            (patient.address[0].postalCode ?
            patient.address[0].postalCode + "" : "") : "");
            var contact = (patient.telecom ?
            (patient.telecom[0].system ?
            patient.telecom[0].system + " " : "") +
            (patient.telecom[0].value ?
                patient.telecom[0].value : "") : "");

            var BMI = 31.0;
            if(patientBMICall)
                if(patientBMICall.entry)
                if(patientBMICall.entry[0])
                    if(patientBMICall.entry[0].resource)
                        if(patientBMICall.entry[0].resource.valueQuantity)
                            BMI = patientBMICall.entry[0].resource.valueQuantity.value ? patientBMICall.entry[0].resource.valueQuantity.value : "";

            var weight = 70;
            if(patientWeightCall)
                if(patientWeightCall.entry)
                if(patientWeightCall.entry[0])
                    if(patientWeightCall.entry[0].resource)
                        if(patientWeightCall.entry[0].resource.valueQuantity)
                            var weight = patientWeightCall.entry[0].resource.valueQuantity.value ? patientWeightCall.entry[0].resource.valueQuantity.value : "";

            var weightUnit = "kg";
            if(patientWeightCall)
                if(patientWeightCall.entry)
                if(patientWeightCall.entry[0])
                    if(patientWeightCall.entry[0].resource)
                        if(patientWeightCall.entry[0].resource.valueQuantity)
                            weightUnit = patientWeightCall.entry[0].resource.valueQuantity.unit ? patientWeightCall.entry[0].resource.valueQuantity.unit : "";

            var height = 150;
            if(patientHeightCall)
                if(patientHeightCall.entry)
                if(patientHeightCall.entry[0])
                    if(patientHeightCall.entry[0].resource)
                        if(patientHeightCall.entry[0].resource.valueQuantity)
                            height = patientHeightCall.entry[0].resource.valueQuantity.value ? patientHeightCall.entry[0].resource.valueQuantity.value : "";

            var heightUnit =  "cm";
            if(patientHeightCall)
                if(patientHeightCall.entry)
                if(patientHeightCall.entry[0])
                    if(patientHeightCall.entry[0].resource)
                        if(patientHeightCall.entry[0].resource.valueQuantity)
                            heightUnit = patientHeightCall.entry[0].resource.valueQuantity.unit ? patientHeightCall.entry[0].resource.valueQuantity.unit : "";

            console.log("BMI " + BMI);
            localStorage.setItem("BMI", BMI);

            var BMIClassification;
            switch (true) {
                case (BMI <= 18.5):
                    BMIClassification = $("<div></div>")
                        .append($("<strong></strong>")
                            .addClass("text-warning")
                            .html("Underweight </br> BMI: " + BMI));
                    break;
                case (18.5 < BMI && BMI <= 25):
                    BMIClassification = $("<div></div>")
                        .append($("<strong></strong>")
                            .addClass("text-info")
                            .html("Normal weight </br> BMI: " + BMI));
                    break;
                case (25 < BMI && BMI <= 30):
                    BMIClassification = BMIClassification = $("<div></div>")
                        .append($("<strong></strong>")
                            .addClass("text-warning ")
                            .html("Overweight </br> BMI: " + BMI));
                    break;
                case (30 < BMI && BMI <= 35):
                    BMIClassification = $("<div></div>")
                        .append($("<strong></strong>")
                            .addClass("text-danger ")
                            .html("Class I obesity </br> BMI: " + BMI));
                    break;
                case (35 < BMI && BMI <= 40):
                    BMIClassification = $("<div></div>")
                        .append($("<strong></strong>")
                            .addClass("text-danger ")
                            .html("Class II obesity </br> BMI: " + BMI));
                    break;
                case (40 < BMI):
                    BMIClassification = $("<div></div>")
                        .append($("<strong></strong>")
                            .addClass("text-danger ")
                            .html("Class III obesity </br> BMI: " + BMI));
                default:
                    BMIClassification = "BMI: ー"
            }
            var familyMembers = {};
            if (familyCall) {
                if (familyCall.entry) {
                    for (var idx = 0; idx < familyCall.entry.length; idx++) {
                        var member = familyCall.entry[idx].resource;
                        var memberName = member.name ? member.name.given[0] + " " + member.name.family[0] : "";
                        familyMembers[memberName] = member.relationship.coding[0].display;
                    }
                }
            }

            var infoBox = $("<div></div>")
                    .attr("style", "margin: 10pt; padding: 5pt; background-color: #F8F8F8; border: 1pt solid #DFDFDF")
                    .append($("<h4></h4>")
                        .addClass("text-center text-muted")
                        .html("Child's Name:"))
                    .append($("<div></div>")
                        .addClass("text-center text-primary")
                        .html(patientName))
                    .append($("<h4></h4>")
                        .addClass("text-center text-muted")
                        .html("Household Member Names:"));
            for (var key in familyMembers) {
                if (familyMembers.hasOwnProperty(key)) {
                    infoBox.append($("<strong></strong>")
                        .html(key));
                    infoBox.append($("<span></span>")
                        .html(" - " + familyMembers[key]));
                    infoBox.append($("<br/>"));
                }
            }
            infoCallout.append($("<div></div>")
                .addClass("col-xs-2")
                .attr("style", "position:fixed")
                .append(infoBox));

            if (questionnaireCall.entry) {
                var questionnaire = questionnaireCall.entry[0].resource;
            }

            var questionnaireId = "";
            if (questionnaire) {
                questionnaireId = (questionnaire.id ? questionnaire.id : "");
            }

            var questionnaireVersion = "";
            var questionnaireLastUpdated = "";

            if (questionnaire) {
                if(questionnaire.meta){
                    questionnaireVersion = (questionnaire.meta.versionId ? questionnaire.meta.versionId : "");
                    questionnaireLastUpdated = (questionnaire.meta.lastUpdated ? questionnaire.meta.lastUpdated.split("T")[0] : "");

                }
            }
            theSurvey.append($("<div id='hhg-question-wrapper'></div>")
                .html("<hr>")
                .append($("<h1></h1>")
                    .addClass("text-center text-muted btn-group-sm")
                    .html("Your child's goal")));
            for(var i = 0; i < questionnaire.group.question.length; i++) {
                var surveyRow;
                if (typeof questionnaire.group.question[i].option != "undefined") {
                    var linkId = questionnaire.group.question[i].linkId;
                    surveyRow = $("<div></div>")
                        .addClass("text-center")
                        .attr("data-toggle", "buttons")
                        .attr("role", "group")
                        .attr("link-id", linkId);
                    for (var j = 0; j < questionnaire.group.question[i].option.length; j++) {
                        var display = questionnaire.group.question[i].option[j].display;
                        surveyRow.append($("<div></div>")
                            .addClass("btn-group btn-group-sm")
                            .attr("role", "group")
                            .append($("<a></a>")
                                .addClass("btn btn-default btn-responsive btn-"+linkId)
                                .attr("type", "button")
                                .attr("value", questionnaire.group.question[i].option[j].code)
                                .attr("onclick", "javascript:$('.btn-"+linkId+"').removeClass('active');$(this).addClass('active');")
                                .html(display)));
                    }
                } else {
                    surveyRow = $("<div></div>")
                        .addClass("question freeform")
                        .attr("data-toggle", "textarea")
                        .attr("role", "group")
                        .attr("link-id", questionnaire.group.question[i].linkId);
                    surveyRow.append($("<textarea style='width:100%'></textarea>"));
                }
                theSurvey.append($("<div></div>")
                    .addClass("row well")
                    .append($("<div></div>")
                        .addClass("text-center text-muted")
                        .append($("<h4></h4>")
                            .html(questionnaire.group.question[i].text)))
                    .append($("<div></div>")
                        .append(surveyRow)));
            	}
                theSurvey.append($("<a></a>")
                    .addClass("btn btn-default btn-responsive")
                    .attr("type", "button")
                    .attr("onclick", "javascript:GC.saveAndPrintPhysicianGoal()")
                    .html("Save and Print"));

        });
    }

    NS.savePhysicianGoal = function() {
        var qr = [];
        var questions = $('#theSurvey-div').find('.question').each(function(i) {
            var answer = {};
            if ($(this).hasClass('multi')) {
                $(this).find('a').each(function(j) {
                    if ($(this).hasClass('active')) {
                        answer = {"valueInteger": $(this).attr('value')};
                    }
                });
            } else if ($(this).hasClass('freeform')) {
                answer = {"valueString": $(this).children('textarea').val()};
            }
            qr.push({
                "linkId": $(this).attr('link-id'),
                "answer": [answer]
            });
        });
        window.sessionStorage.setItem('hhgoal_info', JSON.stringify(qr));

        // TODO: find out why other POSTs in the app aren't using the FHIR client for this...
        // because they aren't I'm also avoiding it here (for now), but not 100% sure whether
        // I should *really* be doing that.

        var GoalQuestionsID = window.sessionStorage.getItem('healthy_habits_goal_questions_id');
        var timestamp = new Date();
        var response = {
            "resourceType": "QuestionnaireResponse",
            "questionnaire": {"reference": "Questionnaire/" + GoalQuestionsID},
            "text": {
                "status": "generated",
                "div": "<div>Patient response to Healthy Habits Goal questionnaire</div>"
            },
            "status": "completed",
            "author": {"reference": "Patient/" + patientID},
            "subject": {"reference": "Patient/" + patientID},
            "authored": timestamp.toISOString(),
            "group": {
                "linkId":"root",
                "question":qr
            }
        };

        var QuestionnaireResponsePOST = null;
         $.ajax({
            type: 'POST',
            async: false,
            global: false,
            url: fhir_url +'QuestionnaireResponse',
            data: JSON.stringify(response),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                QuestionnaireResponsePOST = data;
                console.log( QuestionnaireResponsePOST.valueOf());
            }
        });
        return QuestionnaireResponsePOST;
        //return qr;
    };

    NS.saveAndPrintPhysicianGoal = function() {
        GC.savePhysicianGoal();
        GC.App.print();
    };

    NS.PhysicianGoal =
    {
        render : function() 
        {

                renderPhysicianGoal("#view-goal");

        }
    };

    NS.HHGPrintView =
    {
        render : function()
        {
            renderPhysicianGoalForPrint("#view-goal");
        }
    };

    $(function() 
    {
        if (!PRINT_MODE) 
        {

            $("html").bind("set:viewType set:language", function(e) 
            {
                if (isPhysicianGoalVisible())
                {
                    renderPhysicianGoal("#view-goal");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) 
            {
                if (isPhysicianGoalVisible())
                {
                    renderPhysicianGoal("#view-goal");
                }
            });

            GC.Preferences.bind("set", function(e) 
            {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") 
                {
                    if (isPhysicianGoalVisible())
                    {
                        renderPhysicianGoal("#view-goal");
                    }
                }
            });


            GC.Preferences.bind("set:timeFormat", function(e) 
            {
                renderPhysicianGoal("#view-goal");
            });

       }
    });

}(GC, jQuery));
