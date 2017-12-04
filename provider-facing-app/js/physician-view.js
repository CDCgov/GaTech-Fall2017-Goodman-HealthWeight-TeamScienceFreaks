/*global
 Chart, GC, PointSet, Raphael, console, $,
 jQuery, debugLog,
 XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function(NS, $)
{

    "use strict";
    var fhir_url = window.sessionStorage.getItem('fhir_url_global')  + '/';
    var patientID = window.sessionStorage.getItem('patientid_global');

    var selectedIndex = -1,
        PATIENT,
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

    function isPhysicianViewVisible()
    {
        return GC.App.getViewType() == "view";
    }

    /**
     * Modified getVitals function from gc-parental-view
     * Collects and returns the latest measurements and returns them as an
     * useful object...
     */
    function getVitals(PATIENT) {
        var out = {
                height : { value : undefined, "percentile" : null, "unit": "m"},
                weight : { value : undefined, "percentile" : null, "unit": "kg"},
                headc  : { value : undefined, "percentile" : null, "unit": "cm"},
                bmi    : { value : undefined, "percentile" : null, "unit": "kg/m^2"},

                age : PATIENT.getCurrentAge()
            },
            src    = out.age.getYears() > 2 ? "CDC" : "WHO",
            gender = PATIENT.gender;

        $.each({
            height : { modelProp: "lengthAndStature", dsType : "LENGTH" },
            weight : { modelProp: "weight"          , dsType : "WEIGHT" },
            headc  : { modelProp: "headc"           , dsType : "HEADC"  },
            bmi    : { modelProp: "bmi"             , dsType : "BMI"    }
        }, function(key, meta) {
            var lastEntry = PATIENT.getLastEnryHaving( meta.modelProp ), ds, pct;
            if (lastEntry) {
                ds = GC.getDataSet(src, meta.dsType, gender, 0, lastEntry.agemos);
                out[key].value  = lastEntry[meta.modelProp];
                if (ds) {
                    out[key].unit = ds.units;
                    pct = GC.findPercentileFromX(
                        out[key].value,
                        ds,
                        gender,
                        lastEntry.agemos
                    
                    );
                    if ( !isNaN(pct) ) {
                        out[key].percentile  = pct;
                    }
                }
            }
        });

        return out;
    }

    function convertToPercent(decimal) {
        return Math.round(decimal * 100) + '%';
    }

    function create_hhh_panel( hhg_qr) {

       var goalMap = {
            1: 'Make half your plate fruits and veggies',
            2: 'Be active',
            3: 'Limit screen time',
            4: 'Drink more water & limit sugary drinks'
        };

        var PhysicianSelectedGoal  = "N/A";
        var barriersDiscussed = "N/A";
        var otherNotes = "N/A";
        if(typeof hhg_qr.entry != 'undefined')
        {
            var PhysicianSelectedGoalTemp = hhg_qr.entry[0].resource.group.question[0].answer[0].valueInteger;
            if(PhysicianSelectedGoalTemp) {
                PhysicianSelectedGoal =  goalMap[PhysicianSelectedGoalTemp];
            }

            var barriersTemp = hhg_qr.entry[0].resource.group.question[7].answer;
            if(barriersTemp) {
                barriersDiscussed = barriersTemp[0].valueString;
            }


            var otherNotesTemp = hhg_qr.entry[0].resource.group.question[8].answer;
            if(otherNotesTemp) {
                otherNotes = otherNotesTemp[0].valueString;
            }

        }

        var hhh_panel = "";
        hhh_panel += ("<style> .Cphysician-hhh-panel { font-style: italic; margin-left: 10px ; font-size: 12px;} </style> ");
        hhh_panel += ("<div id='physician-hhh-panel'>");
        hhh_panel += ("<b>Patient wanted to discuss:</b>");
        hhh_panel += ("<blockquote class='Cphysician-hhh-panel'> <b>" + PhysicianSelectedGoal + "</b> </blockquote>");
        hhh_panel += ("<b>Last discussion of barriers:</b>");
        hhh_panel += ("<blockquote class='Cphysician-hhh-panel'>" + barriersDiscussed + "</blockquote>");
        hhh_panel += ("<b>Other notes:</b>");
        hhh_panel += ("<blockquote class='Cphysician-hhh-panel'>" + otherNotes + "</blockquote>");
        hhh_panel += ("</div>");

        //$(container).append(hhh_panel);  
        //$( wants_to_discuss_div ).append( hhh_panel);

        var CurrentGoal_str   ='                                                                                     ' 
                              +' <p> Most recent physician chosen goal:  <b>' + PhysicianSelectedGoal + '</b></p>        '  
                              +' <p> Most recent notes:  <b>' + otherNotes + '</b></p>        '
                              +' <p> Most recent barriers Discussed:  <b>' + barriersDiscussed + '</b></p>        ';

        $( CurrentGoal_div ).append( CurrentGoal_str);

    }

    function create_hhh_tbl(container, hhg_qr) {

        var goalMap = {
            1: 'Make half your plate fruits and veggies',
            2: 'Be active',
            3: 'Limit screen time',
            4: 'Drink more water & limit sugary drinks'
        };

        var hhh_tbl = "";

        hhh_tbl += ("<div id='physician-hhh-tbl'>");
        hhh_tbl += ("<table> <tr> <th>Healthy Habit Goal</th> <th>Start Date</th> <th>End Date</th> <th>Barriers Discussed</th> </tr>");

        if(hhg_qr.entry){

            var hhg_qr_len = hhg_qr.entry.length;

            var prevGoal = 0;
            var prevStartDate = "";
            var prevEndDate = "";

            //console.log("QR LENGTH " + hhg_qr_len);
            for (var i = 0; i < hhg_qr_len; i++) {

                var response = hhg_qr.entry[i].resource;

                //console.log(i + " " + hhg_qr.entry[i].resource.group.question[0].answer[0].valueInteger);
                var goalResp = response.group.question[0].answer[0].valueInteger;
                var goalSet = goalMap[goalResp];

                var authorDate = (response.authored ? response.authored.split("T")[0] : "N/A");

                //console.log(i + " " + hhg_qr.entry[i].resource.group.question[7].answer[0].valueString);
                var barriersDiscussed = response.group.question[7].answer[0].valueString;

                var endDate = "";
                if(i == 0){
                    endDate = "Current";
                    prevEndDate = endDate;
                    prevStartDate = authorDate;
                    prevGoal = goalResp;
                } else {
                    if (goalResp == prevGoal) {
                        endDate = prevEndDate;
                        prevEndDate = endDate;
                        prevStartDate = authorDate;
                    } else {
                        endDate = prevStartDate;
                        prevEndDate = endDate;
                        prevStartDate = authorDate;
                        prevGoal = goalResp;
                    }
                }

                hhh_tbl += ("<tr> <td>" + goalSet + "</td> <td>" + authorDate + "</td> <td>" + endDate + "</td> <td>" + barriersDiscussed + "</td> </tr>");
            }

        } else {
            hhh_tbl += ("<tr> <td>No Healthy Habit Goal Set</td> <td>N/A</td> <td>N/A</td> <td>N/A</td> </tr>");
        }

        hhh_tbl += ("</table>");
        hhh_tbl += ("</div>")

        $(container).append(hhh_tbl);
    }

    /**
     * Sigh.  This function and the constants within it are stolen wholesale from gc-parental-view.js because I only discovered 90 minutes before
     * the demo that the BMI calculations implemented in *this* view were incorrect.
     */
    function getHeuristics(PATIENT) {
        var AGES = {
            Infant     : 1,
            Toddler    : 4,
            Child      : 12,
            Adolescent : 20
        };
        var WEIGHT_STATES = {
            UNDERWEIGHT : "underweight",
            HEALTHY     : "healthy",
            OVERWEIGHT  : "overweight",
            OBESE       : "obese"
        };
        var WEIGHT_TRENDS = {
            MORE_UNDERWEIGHT     : 2,
            MORE_OBESE           : 4,
            RISK_FOR_UNDERWEIGHT : 8,
            RISK_FOR_OVERWEIGHT  : 16,
            RISK_FOR_OBESE       : 32,
            IMPROVING            : 64,
            NONE                 : 128
        };


        var out = {},
            lastWeightEntry = PATIENT.getLastEnryHaving("weight"),
            lastHeightEntry = PATIENT.getLastEnryHaving("lengthAndStature"),
            prevWeightEntry,
            dataSet = GC.DATA_SETS.CDC_WEIGHT,
            weightPctNow,
            weightPctPrev,
            bmi, bmiPctNow, healthyWeightMin, healthyWeightMax, D;

        out.name = PATIENT.name;

        if (!lastWeightEntry || !lastHeightEntry) {
            out.error = [
                PATIENT.name,
                GC.str("STR_183"),
                GC.str(PATIENT.gender == "male" ? "STR_181" : "STR_182"),
                GC.str("STR_184")
            ].join(" ");
        }

        else {

            weightPctNow = GC.findPercentileFromX(
                lastWeightEntry.weight,
                dataSet,
                PATIENT.gender,
                lastWeightEntry.agemos
            ) * 100;

            weightPctPrev = weightPctNow;

            prevWeightEntry = PATIENT.getLastModelEntry(function(entry) {
                return entry.weight !== undefined && entry.agemos < lastWeightEntry.agemos;
            });

            if (prevWeightEntry) {
                weightPctPrev = GC.findPercentileFromX(
                    prevWeightEntry.weight,
                    dataSet,
                    PATIENT.gender,
                    prevWeightEntry.agemos
                ) * 100;
            }

            bmi = lastWeightEntry.weight / Math.pow(lastHeightEntry.lengthAndStature / 100, 2);


            var vitals = getVitals(PATIENT);
            bmiPctNow = vitals.bmi.percentile * 100;

            healthyWeightMin = GC.findXFromPercentile(
                0.05,
                dataSet,
                PATIENT.gender,
                lastWeightEntry.agemos
            );

            healthyWeightMax = GC.findXFromPercentile(
                0.85,
                dataSet,
                PATIENT.gender,
                lastWeightEntry.agemos
            );

            D = weightPctNow - weightPctPrev;

            if (bmiPctNow < 5) {
                out.state = WEIGHT_STATES.UNDERWEIGHT;
                out.stateGoingTo = D < -1 ?
                    WEIGHT_TRENDS.MORE_UNDERWEIGHT :
                    WEIGHT_TRENDS.IMPROVING;
            } else if (bmiPctNow <= 85) {
                out.state = WEIGHT_STATES.HEALTHY;
                out.stateGoingTo = D < -1 && weightPctNow <= 10 ?
                    WEIGHT_TRENDS.RISK_FOR_UNDERWEIGHT :
                    D > -1 && weightPctNow > 80 ?
                        WEIGHT_TRENDS.RISK_FOR_OVERWEIGHT :
                        WEIGHT_TRENDS.NONE;
            } else if ( bmiPctNow <= 95) {
                out.state = WEIGHT_STATES.OVERWEIGHT;
                out.stateGoingTo = D < -1 ?
                    WEIGHT_TRENDS.IMPROVING :
                    WEIGHT_TRENDS.RISK_FOR_OBESE;
            } else {
                out.state = WEIGHT_STATES.OBESE;
                out.stateGoingTo = D < -1 ?
                    WEIGHT_TRENDS.IMPROVING :
                    WEIGHT_TRENDS.MORE_OBESE;
            }

            out.lastWeight       = lastWeightEntry.weight;
            out.healthyWeightMin = healthyWeightMin;
            out.healthyWeightMax = healthyWeightMax;
        }

        return out;
    }

    function renderPhysicianView(container) {
        $(container).empty();
        var topContainer = $("<div></div>").addClass("row");
        topContainer.attr("id", "thePatient-div");
        $(container).append(topContainer);
        var thePatient = $("<div></div>").addClass("col-xs-6 col-xs-offset-1").attr("id", "thePatientInfo-div");
        topContainer.append(thePatient);
        var patientInfo = $("<div></div>").addClass("col-xs-4");
        patientInfo.attr("id", "patientInfo-div");

        var InfantQuestionsID = window.sessionStorage.getItem('infant_questions_id');
        var AdolescentQuestionsID = window.sessionStorage.getItem('adolescent_questions_id');
        var questionsID = InfantQuestionsID;

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

        var questionnaireResponseCall = (function () {
            var questionnaireResponseCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'QuestionnaireResponse?patient=' + patientID + "&questionnaire=" + questionsID + "&_sort:desc=authored",
                dataType: 'json',
                success: function (data) {
                    questionnaireResponseCall = data;
                }
            });
            return questionnaireResponseCall;
        })();

        var wicQuestionnaireResponseCall = (function () {
            var wicQuestionnaireResponseCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'/QuestionnaireResponse/1081290',
                dataType: 'json',
                success: function (data) {
                    wicQuestionnaireResponseCall = data;
                }
            });
            return wicQuestionnaireResponseCall;
        })();

        var questionnaireCall = (function () {
            var questionnaireCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Questionnaire?_id=' + questionsID,
                dataType: 'json',
                success: function (data) {
                    questionnaireCall = data;
                }
            });
            return questionnaireCall;
        })();

        var wicQuestionnaireCall = (function () {
            var wicQuestionnaireCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'Questionnaire/1081184',
                dataType: 'json',
                success: function (data) {
                    wicQuestionnaireCall = data;
                }
            });
            return wicQuestionnaireCall;
        })();

        var theQuestionnaires = $("<div></div>").addClass("row");
        theQuestionnaires.attr("id", "theQuestionnaires-div");
        

        var hhgQuestionsID = window.sessionStorage.getItem('hhg_questions_id');

        var hhgQuestionnaireResponseCall = (function () {
            var hhgQuestionnaireResponseCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'QuestionnaireResponse?patient=' + patientID + "&questionnaire=" + hhgQuestionsID + "&_sort:desc=authored",
                dataType: 'json',
                success: function (data) {
                    hhgQuestionnaireResponseCall = data;
                }
            });
            return hhgQuestionnaireResponseCall;
        })();

        var patientHemoCall = (function () {
            var patientHemoCall = null;
            //refer to http://docs.smarthealthit.org/tutorials/server-quick-start/

            //Note LOINC Codes: 8302-2 for Height BMI Observations
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'Observation?subject:Patient=' + patientID + '&code=718-7&_count=50',
                dataType: 'json',
                success: function (data) {
                    patientHemoCall = data;
                }
            });
            return patientHemoCall;
        })();

        $.when(patientCall, questionnaireResponseCall, wicQuestionnaireResponseCall ,questionnaireCall, hhgQuestionnaireResponseCall).then(function() {

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

            var latestRecording = getVitals(GC.App.getPatient());
            var hemo = {'hemo': -1,  'hemoUnit': 'mg/dL', 'hemoStamp': 0 };

            var process = function(d, l, arr) {
                if (typeof d == 'undefined') return;
                for (var i = d.length - 1; i >= 0; i--) {
                    if (d[i] != undefined && d[i].resource.effectiveDateTime != undefined) {
                        var t = Date.parse(d[i].resource.effectiveDateTime);
                        if (t > arr[l + 'Stamp']) {
                            arr[l + 'Stamp'] = t;
                            arr[l] = d[i].resource.valueQuantity.value;
                            arr[l + 'Unit'] = d[i].resource.valueQuantity.unit;
                        }
                    }
                }
            };

            process(patientHemoCall.entry, 'hemo', hemo);

            var formatData = function(data, includeUnits) {
                return '<span class="recordedValue">' + data.value + '</span>'
                    + (includeUnits ? data.unit : "")
                    + ' ('+Math.round(data.percentile*100)+'%)';
            };

            localStorage.setItem("BMI", latestRecording.bmi.value);

            var bmiText, bmiClass;

            var bmiMetadata = getHeuristics(GC.App.getPatient());

            // FIXME: The comparisons can be optimized by inversing the evaluation order
            switch (bmiMetadata.state) {
                case ("underweight"):
                    bmiText = 'Underweight </br> BMI: '+formatData(latestRecording.bmi, false);
                    bmiClass = 'text-warning';
                    break;
                case ("healthy"):
                    bmiText = 'Normal weight </br> BMI: '+formatData(latestRecording.bmi, false);
                    bmiClass = 'text-info';
                    break;
                case ("overweight"):
                    bmiText = 'Overweight </br> BMI: '+formatData(latestRecording.bmi, false);
                    bmiClass = 'text-warning';
                    break;
                case ("obese"):
                    bmiText = 'Obese </br> BMI: '+formatData(latestRecording.bmi, false);
                    bmiClass = 'text-danger';
                    break;
                default:
                // This should never happen
                // BMIClassification = "BMI: ー"
            }

            var BMIClassification = $("<div></div>")
                .append($("<strong></strong>")
                    .addClass(bmiClass)
                    .html(bmiText));

            thePatient.append($("<blockquote></blockquote>")
                .append($("<div></div>")
                    .addClass("patient-info")
                    .append($("<div></div>")
                        .addClass("patient-fullname")
                        .attr("id", "patient-fullname")
                        .append($("<strong></strong>")
                            .html(patientName)
                        )
                    )
                    .append($("<div></div>")
                        .addClass("patient-contact")
                        .attr("id", "patient-contact")
                        .append($("<abbr></abbr>")
                            .attr("title", "Contact")
                            .html(contact)))
                    .append($("<div></div>")
                        .addClass("patient-address")
                        .attr("id", "patient-address")
                        .append($("<address></address>")
                            .html(address)
                        )
                    )
					.append($("<div></div>")
                        .attr("id", "patient-BMI")
                        .append(BMIClassification)
					)
                    .append($("<small></small>")
                        .append($("<div></div>")
                            .addClass("patient-gender text-capitalize")
                            .attr("id", "patient-gender")
                            .html("<strong>Patient ID: </strong>" + patientId)
                        )
                    )
                )
            );

            patientInfo.append($("<div></div>")
                .addClass("patient-info")
                .append($("<blockquote></blockquote>")
                    .addClass("blockquote-reverse")
                    .append($("<div></div>")
                        .addClass("patient-gender text-capitalize")
                        .attr("id", "patient-gender")
                        .html("<strong>Gender: </strong>" + patientGender)
                    )
                    .append($("<div></div>")
                        .addClass("patient-bday dt")
                        .attr("id", "patient-bday")
                        .html("<strong>Birthdate: </strong>" + patientBDay)
                    )
                    .append($("<div></div>")
                        .attr("id", "patient-BMI")
                        .append(BMIClassification))
                    .append($("<div></div>")
                        .addClass("patient-weight")
                        .attr("id", "patient-weight")
                        .html("<strong>Weight: </strong>"+formatData(latestRecording.weight, true))
                    )
                    .append($("<div></div>")
                        .addClass("patient-height")
                        .attr("id", "patient-height")
                        .html("<strong>Height: </strong>"+formatData(latestRecording.height, true))
                    )
                    .append($("<div></div>")
                        .addClass("patient-hemo")
                        .attr("id", "patient-hemo")
                        .html("<strong>Hemoglobin: </strong><span class='recordedValue'>" + hemo.hemo +
                              "</span> " + hemo.hemoUnit)
                    )
                    .append($('<div><input type="button" id="patient-update-button" value="Log Values"></div>')
                        .attr("id", "patient-update")
                        .attr("style", GC.App.nutritionistMode ? "" : "display:none")
                    )
                 )
              );

            topContainer.append(patientInfo);

         var graph_str   ='                                                                                     ' 
                         +'        <style>  '
                         +'        .carousel-control.left, .carousel-control.right { background-image: none}         '
                         +'        .carousel-indicators li { visibility: hidden; }'
                         +'        </style>                                                                                                   '
                         +'        <div id="HHitem"> <h2  align="center">Health Habit Item: Progress History</h2></div>                                           '
                         +'        <div class="container" id="historyGraphDiscuss">                                                       '
                         +'            <div class="row">                                                                                  '
                         +'                 <div class="col-sm-8 graph_col_h1" id="GraphCarousel_div" style="border:1px solid black;margin-left:8.333%" >     '
                         +'                       <div id="myGraphCarousel" class="carousel slide" data-ride="carousel">       '
                         +'                          <ol id="GraphCarouselIndicators"  class="carousel-indicators" style="visibility:hidden;"> </ol>'
                         +'                          <div id="carousel_inner_id" class="carousel-inner" role="listbox"> </div> '
                         +'                           <!-- Left and right controls -->'
                         +'                           <a class="left carousel-control" href="#myGraphCarousel" role="button" data-slide="prev">'
                         +'                              <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>'
                         +'                              <span class="sr-only">Previous</span>'
                         +'                           </a>'
                         +'                           <a class="right carousel-control" href="#myGraphCarousel" role="button" data-slide="next">'
                         +'                              <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>'
                         +'                              <span class="sr-only">Next</span>'
                         +'                           </a>'
                         +'                       </div>    '
                         +'                  </div>    '
                         +'                  <div class="col-sm-1 graph_col_h1" id="graph_key_div" style="border:1px solid black"><b>Click on Healthy Habit to see change over time graph:</b><p></p> </div>       '
                        // +'                  <div class="col-sm-2 graph_col_h1" id="wants_to_discuss_div" ></div>                                   ' 
                         +'            </div>    '
                         +'            <div class="row">                                                                                  '
                         +'                 <div class="col-sm-8 " id="CurrentGoal_div" style="border:1px solid black;margin-left:8.333%;margin-top:10px"> </div>    '
                         +'            </div>    '
                         +'        </div><p> </p>                                                                                             ';   
                
                      

            $(container).append(graph_str);    

            var hhg_qr = hhgQuestionnaireResponseCall;
            var qr = questionnaireResponseCall;

            //console.log("HHG");
            //console.log(hhg_qr);

            create_hhh_tbl(container, hhg_qr);

            create_hhh_panel( hhg_qr, qr);

             $(container).append(theQuestionnaires);
            /*****************************  graphs **************************/

            /****************  This canvas graph was authored by jbarron30@gatech.edu, If you have any questions about it please  ask********/

            function create_graph( Question, key_word, answer_date , multiple_choices, canvasCount, PhysGoal_date, graphcolor) 
            {
                var legend_id= "legend_id_" + canvasCount;
                var height = 400;
                var width = 795;
                var margin = 30;
                var left_margin = 185; //size should be calculated the longest string in all the multiple_choices
                var right_margin = 30; //size should be calculated to be as long as a date of the authored field
                

                var canvas_Carousel_id= "canvas_Carousel" + key_word;
                var canvas_str = '<canvas id="' + canvas_Carousel_id + '" height="'+ height +'" width="'+ width +'" style="border:1px solid #000000;" ></canvas>';
           
                //insert canvas into bootstrap carousel
                var current_PhysicianGoal = "";
                if(PhysGoal_date.length ==0)   //in case of children with no HHG
                {
                    current_PhysicianGoal = 1; //set the first question active
                }
                else
                {
                    var current_PhysicianGoal = PhysGoal_date[ 0].physGoal;
                }
                //canvas count is the order of the questions in the HH QR 
                if(current_PhysicianGoal == canvasCount +1)
                {
                    var ol_str = '<li data-target="#myGraphCarousel" data-slide-to="'+canvasCount+ '" class="active"></li>';
                    var item_str ='<div class="item active">'+ canvas_str +'</div>';
                    $('#HHitem').css('color', graphcolor);
                }
                else
                {
                    var ol_str = '<li data-target="#myGraphCarousel" data-slide-to="'+canvasCount+ '" ></li>';
                    var item_str ='<div class="item">'+ canvas_str +'</div>';
                }

                $('#GraphCarouselIndicators').append( ol_str);
                $('#carousel_inner_id').append( item_str);

                //set up canvas
                var canvas = document.getElementById(canvas_Carousel_id);
                var context = canvas.getContext("2d");
                context.font = "bold 13px Verdana"
                context.fillText(Question, margin , margin );
                context.font = "10px Verdana"
 

                //draw and label the row grid lines
                context.strokeStyle="#009933"; // color of grid lines
                var number_of_rows = multiple_choices.length;
                var yStep = (canvas.height - margin ) / number_of_rows;

                context.beginPath();
                for (var row_count = 0; row_count < number_of_rows; row_count++)
                {
                    var y =  (canvas.height - margin) - (row_count * yStep) ;
                    context.fillText(multiple_choices[row_count], margin, y );
                    context.moveTo(left_margin ,y);
                    context.lineTo(canvas.width,y);
                }
                context.stroke();


                // print dates on X axis every 3 months
                //1. convert newest and oldest dates into milliseconds
                var ms_in_3_months = (1000 * 60 * 60 * 24 * 30 *3);
                var oldestDate = answer_date[  answer_date.length -1   ].authored;
                var oldestTime = new Date(oldestDate);
                var newestDate = answer_date[0].authored;
                var newestTime = new Date(newestDate);
                var diff_max = newestTime.getTime() - oldestTime.getTime();  //ms of span from oldest date to newest date
                var diff_max_3_month_periods = diff_max / ms_in_3_months;
                var length_x_axis = canvas.width - left_margin - right_margin -5; //-5 to keep away from right edge
                var section_length = length_x_axis / diff_max_3_month_periods;

                for (var i = 0; i < diff_max_3_month_periods; i++)
                {

                    var d_time = oldestTime.getTime()  + (ms_in_3_months * i );
                    var d      = new Date(d_time);
                    var year = d.getFullYear();
                    var year_2_digit = year.toString().substr(2,2);
                    var d_display = (d.getMonth() + 1 ) + "/" + year_2_digit ;
                    var x = left_margin + i * section_length;
                    context.fillText( d_display , x , (canvas.height -margin/2 ));
                }


                var x_y = [];

                // calculate the irregular interval on x axis
                //1. convert newest and oldest dates into milliseconds and figure out time span
                var oldestDate = answer_date[  answer_date.length -1   ].authored;
                var oldestTime = new Date(oldestDate);
                var newestDate = answer_date[0].authored;
                var newestTime = new Date(newestDate);
                var diff_max = newestTime.getTime() - oldestTime.getTime();  //ms of span from oldest date to newest date
                var length_x_axis = canvas.width - left_margin - right_margin;



                 //determine the locations of the data points
                for (var i = 0; i < answer_date.length; i++)
                {
                    var currDate = answer_date[ i  ].authored;
                    var currTime = new Date(currDate);
                    var diff_to_curr = currTime.getTime() - oldestTime.getTime();
                    var frac_of_span = diff_to_curr /diff_max;
                    var X = (length_x_axis * frac_of_span) + left_margin;
                    var Y  = (canvas.height - margin) - ((answer_date[ i ].answer -1) * yStep) ;
                    x_y.push({ x:X , y:Y});

                }


                //draw the line on graph connecting the data points
                context.lineWidth=2;
                context.strokeStyle="#000000"; 
                for (var i = 0; i < answer_date.length-1; i++)
                {
                      context.beginPath();
                      context.moveTo(x_y[i].x,x_y[i].y)  ;


                      if(answer_date[ i ].is_PhysicianGoal == true  )
                      {

                           context.setLineDash([]); // A solid line
                           context.lineTo(x_y[i+1].x,x_y[i+1].y);
                           context.stroke();
                      }
                      else
                      {
                           context.save();
                           context.setLineDash([5, 15]); // A dashed line
                           context.lineTo(x_y[i+1].x,x_y[i+1].y);
                           context.stroke();
                           context.restore();
                      }
                      
                }
                

                // draw the balls on the data points
                for (var i = 0; i < answer_date.length; i++)
                {
                    // draw the circles
                    context.globalAlpha=1.0;
                    context.fillStyle = "rgba(255, 255, 0, 1.0)";  //yellow non opaque
                    context.strokeStyle="#000000";
                    context.beginPath();
                    context.arc(x_y[i].x , x_y[i].y ,5,0,2*Math.PI);
                    context.closePath();
                    context.fill();
                    context.stroke();

                }


                //append the keyword to the graph key
                $( graph_key_div ).append( '<p id="'+ legend_id +'"  class="legend_class" style="border:1px solid black;font-weight: bold;" >'+ key_word +'</p> <p> </p>'  );
                $('#'+ legend_id).css('color', graphcolor);

            }



           
            var answer_date = [];
            var multiple_choices = [];
            var Question = '';
            var Response = '';
            var Answer = '';
            var Authored = '';
            var questionnaire = '';
            var canvasCount =0;
            var Is_PhysicianGoal = '';
            var PhysGoal ='';
            if (questionnaireCall.entry && questionnaireResponseCall.entry && hhgQuestionnaireResponseCall ) 
            {
                    
                   // create a PhysicialSetGoal Date Array
                    var PhysGoal_date = [];
                    if(hhgQuestionnaireResponseCall.entry)
                    {
                        for(var  hhgqr = 0; hhgqr < hhgQuestionnaireResponseCall.entry.length; hhgqr++)
                        {
                                Response   =   hhgQuestionnaireResponseCall.entry[ hhgqr ].resource;
                                PhysGoal   =   Response.group.question[ 0].answer[ 0 ].valueInteger;
                                //bug fix to take into account the order of goal for physician and patient has 3 and 4 reversed
                                if(PhysGoal == 3) 
                                {
                                    PhysGoal = 4;
                                }
                                else
                                if(PhysGoal == 4) 
                                {
                                    PhysGoal = 3;
                                }  

                                Authored   =   Response.authored.split("T")[ 0 ] ;  
                                PhysGoal_date.push({ physGoal:PhysGoal, authored:Authored });
                        }
                    }

                    //console.log(PhysGoal_date);

                    
                    questionnaire = questionnaireCall.entry[0].resource;

                    for(var q = 0; q < questionnaire.group.question.length; q++)
                    {
                        Question = questionnaire.group.question[q].text
                        

                        var graph_question = "";
                        var want_graph = false;

                        
                        var graphcolor = 'green';
                        var KeyWord = 'veggies and fruits';
                        var want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);

                        if(want_graph == false)
                        {
                            KeyWord = 'active';
                            want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                            graphcolor = 'orange';
                        }

                        if(want_graph == false)
                        {
                            KeyWord = 'fruit juice';
                            want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                            graphcolor = 'red';
                        }

                        if(want_graph == false)
                        {
                            KeyWord = 'sweet drinks';
                            want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                            graphcolor = 'purple';
                        }

                        if(want_graph == false)
                        {
                            KeyWord = 'television';
                            want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                            KeyWord = 'screen time';
                            graphcolor = 'blue';
                        }

                        if(want_graph == true )
                        {
                                multiple_choices = [];
                                for(var j = 0; j < questionnaire.group.question[q].option.length; j++)
                                {
                                    multiple_choices.push(questionnaire.group.question[q].option[j].display);
                                }
 
                                var current_Question = q +1; //the order of the questions in the HHQR should match the order of the goals in the HHG question 
                               
                                answer_date = [];
                                for(var  qr = 0; qr < questionnaireResponseCall.entry.length; qr++)
                                {

                                        Response   =   questionnaireResponseCall.entry[ qr ].resource;
                                        Answer     =   Response.group.question[ q ].answer[ 0 ].valueInteger;
                                        Authored   =   Response.authored.split("T")[ 0 ] ;
                                        
                                        //find the first physician goal older than the time of this data point's Authored time
                                        var AuthoredTime = new Date(Authored);  
                                        Is_PhysicianGoal = false;
                                        for (var i = 0; i < PhysGoal_date.length ; i++)
                                        {
                                            var PhysGoalDate = PhysGoal_date[ i  ].authored;
                                            var PhysGoalTime = new Date(PhysGoalDate);
                                            
                                            if(PhysGoalTime.getTime() <= AuthoredTime.getTime() )
                                            {
                                                //here we have found the first Physician goal older than the current data point

                                                var PGoal = PhysGoal_date[ i  ].physGoal;
                                               
                                                //if the physician goal equals this graph then set this data point to be selected as a current goal
                                                if( PGoal == current_Question )  
                                                {
                                                    Is_PhysicianGoal = true;
                                                }
                                                break;
                                            }
                                        }

                                        answer_date.push({ answer:Answer, authored:Authored, is_PhysicianGoal:Is_PhysicianGoal});
                                }

                                create_graph(Question, KeyWord, answer_date, multiple_choices,canvasCount , PhysGoal_date, graphcolor) ;
                        
                                canvasCount++;
                        }
                    }
                }

               //stop graph scrolling automatically
               $('#myGraphCarousel').carousel('pause');

               //give legend clicks functionality
                $(".legend_class").click(function()
                {

                     //set the title color to match
                     $('#HHitem').css('color', $(this).css('color'));

                     //slide in chosen canvas
                    var this_id = this.id;
                    var this_slider_number = this_id.replace(/^legend_id_/, '');
                    $('#myGraphCarousel').carousel(Number(this_slider_number));
                    $('#myGraphCarousel').carousel('pause');
                
                    

                });

                // set graph columns same height
                $( document ).ready(function() 
                {
                    var heights = $(".graph_col_h1").map(function() 
                    {
                        return $(this).height();
                    }).get(),

                    maxHeight = Math.max.apply(null, heights);

                    $(".graph_col_h1").height(maxHeight);
                });

                $( graph_key_div ).append( '<p></p> <hr>  <b>- - -</b>  not a goal'  );
                $( graph_key_div ).append( '<p></p>       <b>_____</b>  goal'  );

            /***************************** end  graphs **************************/

            /********************************************************************/

            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
            var hhLastUpdated = NaN;
            var wicLastUpdated = NaN;
            if (questionnaireResponseCall.entry) {
                var hhLastUpdated = new Date(questionnaireResponseCall.entry[0].resource.authored ? questionnaireResponseCall.entry[0].resource.authored : "-");
            }
            if (wicQuestionnaireResponseCall) {
                var wicLastUpdated = new Date(wicQuestionnaireResponseCall.authored ? wicQuestionnaireResponseCall.authored: "-");
            }

            if (!isNaN(hhLastUpdated)) {
                theQuestionnaires.append($("<div></div>")
                    .attr("id", "healthyHabits-div")
                    .addClass("col-xs-5 col-xs-offset-1 text-center")
                    .append($("<a></a>")
                        .attr("id", "view-HHQuestionnaireAndResponse")
                        .append($("<h3></h3>")
                            .html("Healthy Habits Assessment Response <br>")
                        )
                        .append($("<p></p>")
                            .html("Updated " + months[hhLastUpdated.getMonth()] + " " + hhLastUpdated.getDate() + ", " + hhLastUpdated.getFullYear())
                        )
                        .append($("<p></p>")
                            .html("click to see results")
                        )
                    )
                );
            } else {
                theQuestionnaires.append($("<div></div>")
                    .attr("id", "healthyHabits-div")
                    .addClass("col-xs-5 col-xs-offset-1 text-center")
                    .append($("<h3></h3>")
                        .html("Healthy Habits Assessment Response <br>")
                    )
                    .append($("<p></p>")
                        .html("The patient has not completed the Healthy Eating Survey")
                    )
                );
            }

            if (!isNaN((wicLastUpdated))) {
                theQuestionnaires.append($("<div></div>")
                    .attr("id", "wic-div")
                    .addClass("col-xs-offset-6 text-center")
                    .append($("<a></a>")
                        .attr("id", "view-WICQuestionnaireAndResponse")
                        .append($("<h3></h3>")
                            .html("WIC Questionnaire Response <br>")
                        )
                        .append($("<p></p>")
                            .html(" Updated " + months[wicLastUpdated.getMonth()] + " " + wicLastUpdated.getDate() + ", " + wicLastUpdated.getFullYear())
                        )
                        .append($("<p></p>")
                            .html("click to see results")
                        )
                    )
                );
            } else {
                theQuestionnaires.append($("<div></div>")
                    .attr("id", "wic-div")
                    .addClass("col-xs-offset-6 text-center")
                    .append($("<h3></h3>")
                        .html("WIC Questionnaire Response <br>")
                    )
                    .append($("<p></p>")
                        .html("The patient has not completed the WIC Questionnaire")
                    )
                );
            }

            $("#dialog").dialog({ autoOpen: false, height: 500, width: 1000, overflow: scroll });
            $("#view-HHQuestionnaireAndResponse").click(function() {

                $("#dialog").empty();

                var theSurvey = $("<div></div>").addClass("col-xs-10 col-xs-offset-1");
                theSurvey.attr("id", "theSurvey-div");
                $("#dialog").append(theSurvey);
                if (questionnaireCall.entry) {
                    var questionnaire = questionnaireCall.entry[0].resource;
                }
                if (questionnaireResponseCall.entry) {
                    var response = questionnaireResponseCall.entry[0].resource;
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
                var responseLastUpdated = "";
                if(response)
                {
                    var responseAuthored = new Date(response.authored ? response.authored : "-");
                    if(response.meta){
                        responseLastUpdated = (response.meta.lastUpdated ? response.meta.lastUpdated.split("T") : "");
                    }
                    var qAndA = [];
                    for(var i = 0; i < questionnaire.group.question.length; i++) {
                        //search for validated by LinkId final answer
                        var question_link_ID = questionnaire.group.question[i].linkId;
                        var qr_index = -1;
                        for (var x = 0; x < response.group.question.length ; x++) {
                            if(question_link_ID == response.group.question[x].linkId){
                                qr_index = x;
                                break;
                            }
                        }
                        if(qr_index == -1){
                            console.log("ERROR: could not validate linkId of question to any existing LinkID in the questionnaire-response");
                            return;
                        }
                        var final_answer = response.group.question[qr_index].answer[0].valueInteger - 1;
                        qAndA.push({question:(questionnaire.group.question[qr_index].text), answerCode:final_answer});
                    }

                    theSurvey.append($("<div></div>")
                        .html("<hr>")
                        .append($("<h1></h1>")
                            .addClass("text-center text-muted btn-group-sm")
                            .html("Healthy habits questionnaire responses")
                        )
                    );

                    for(var i = 0; i < questionnaire.group.question.length; i++) {
                        var options = [];
                        for(var j = 0; j < questionnaire.group.question[i].option.length; j++) {
                            options.push(questionnaire.group.question[i].option[j].display);
                        }
                        var surveyRow = $("<div></div>")
                            .addClass("btn-group")
                            .attr("data-toggle", "buttons")
                            .attr("role", "group");
                        for (var j = 0; j < options.length; j++) {
                            if (qAndA[i].answerCode == j) {
                                if (qAndA[i].answerCode == 0) {
                                    surveyRow.append($("<div></div>")
                                        .addClass("btn-group btn-group-sm")
                                        .attr("role", "group")
                                        .append($("<a></a>")
                                            .addClass("btn btn-default btn-responsive active disabled")
                                            .attr("type", "button").html(options[j]).css('background-color', 'red')
                                        )
                                    );
                                }
                                else if (qAndA[i].answerCode ==1) {
                                    surveyRow.append($("<div></div>")
                                        .addClass("btn-group btn-group-sm")
                                        .attr("role", "group")
                                        .append($("<a></a>")
                                            .addClass("btn btn-default btn-responsive active disabled")
                                            .attr("type", "button").html(options[j]).css('background-color', 'yellow')
                                        )
                                    );
                                }
                                else if (qAndA[i].answerCode == 2) {
                                    surveyRow.append($("<div></d" +
                                        "iv>")
                                        .addClass("btn-group btn-group-sm")
                                        .attr("role", "group")
                                        .append($("<a></a>")
                                            .addClass("btn btn-default btn-responsive active disabled")
                                            .attr("type", "button").html(options[j]).css('background-color', 'blue')
                                        )
                                    );
                                }
                                else {
                                    surveyRow.append($("<div></div>")
                                        .addClass("btn-group btn-group-sm")
                                        .attr("role", "group")
                                        .append($("<a></a>")
                                            .addClass("btn btn-default btn-responsive active disabled")
                                            .attr("type", "button").html(options[j]).css('background-color', 'green')
                                        )
                                    );
                                }
                            }
                            else {
                                surveyRow.append($("<div></div>")
                                    .addClass("btn-group btn-group-sm")
                                    .attr("role", "group")
                                    .append($("<a></a>")
                                        .addClass("btn btn-default btn-responsive disabled")
                                        .attr("type", "button")
                                        .html(options[j])
                                    )
                                );
                            }
                        }
                        theSurvey.append($("<div></div>")
                            .addClass("row well")
                            .append($("<div></div>")
                                .addClass("text-center text-muted")
                                .append($("<h4></h4>")
                                    .html(qAndA[i].question)
                                )
                            )
                            .append($("<div></div>")
                                .append(surveyRow)
                            )
                        );
                    }
                }
                else {
                    $("#dialog").append("<div id='physician-questionnaire-blank'>The patient has not completed the Healthy Eating Survey.</div>");
                }

                $("#dialog").dialog("open");
            });

            $("#dialog").dialog({ autoOpen: false, height: 600, width: 1200, overflow: scroll });
            $("#view-WICQuestionnaireAndResponse").click(function() {
                $("dialog").css("overflow-x", "hidden");
                $("#dialog").empty();

                var wicSurvey = $("<div></div>").addClass("col-xs-12");
                wicSurvey.attr("id", "wicSurvey-div");
                $("#dialog").append(wicSurvey);

                if (wicQuestionnaireCall.group && wicQuestionnaireResponseCall.group) {

                    var wicQuestionnaire = wicQuestionnaireCall.group.group;
                    var linkId;
                    var questionGroups = [];
                    var subQuestionLinkId;
                    var subQuestionGroupID;
                    var wicQRLinkID;
                    var wicSubQRLinkID;
                    var wicQAndA = [];

                    var wicQuestionnaireResponse = wicQuestionnaireResponseCall.group.group;

                    var wicQRIndex = -1;
                    for (var i = 0; i < wicQuestionnaire.length; i++) {
                        linkId = wicQuestionnaire[i].linkId
                        for (var j = 0; j < wicQuestionnaireResponse.length; j++) {
                            wicQRLinkID = wicQuestionnaireResponse[j].linkId;
                            if (linkId == wicQRLinkID) {
                                wicQRIndex = j;
                                break;
                            }
                        }
                        if (wicQRIndex == -1) {
                            console.log("ERROR: could not validate linkId of question to any existing LinkID in the wic-questionnaire-response");
                            return;
                        }

                        questionGroups.push({groupID:wicQuestionnaire[wicQRIndex].linkId, Topic:wicQuestionnaire[wicQRIndex].text});

                        var wicSubQRIndex = -1;
                        for (var j = 0; j < wicQuestionnaire[wicQRIndex].question.length; j++) {
                            subQuestionLinkId = wicQuestionnaire[wicQRIndex].question[j].linkId;
                            for (var k = 0; k < wicQuestionnaireResponse[wicQRIndex].question.length; k++) {
                                wicSubQRLinkID = wicQuestionnaire[wicQRIndex].question[k].linkId;
                                if (subQuestionLinkId == wicSubQRLinkID) {
                                    wicSubQRIndex = k;
                                    break;
                                }
                            }
                            if (wicSubQRIndex == -1) {
                                console.log("ERROR: could not validate linkId of sub-question to any existing LinkID in the wic-questionnaire-response");
                                return;
                            }

                            //region wicQandA
                            var codes = [];
                            var options = [];
                            var answer;
                            var id = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].linkId;
                            var groupID = wicQuestionnaire[wicQRIndex].linkId;
                            var questionType = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].type;
                            subQuestionLinkId = wicQuestionnaireResponse[wicQRIndex].question[wicSubQRIndex].linkId;
                            subQuestionGroupID = wicQuestionnaireResponse[wicQRIndex].linkId;
                            var questionAsked = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].text;
                            var questionResponseType = wicQuestionnaireResponse[wicQRIndex].question[wicSubQRIndex].answer[0];

                            if (questionType == "boolean" && questionResponseType.valueBoolean !== undefined && id == subQuestionLinkId) {
                                for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                    codes.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].code);
                                    options.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].display);
                                }
                                answer = questionResponseType.valueBoolean;
                                wicQAndA.push({
                                    ID: id,
                                    groupID: groupID,
                                    question: questionAsked,
                                    answer: answer,
                                    responseChoices: options,
                                    responseChoiceCodes: codes,
                                    responseType: questionType
                                });
                            }
                            if (questionType == "text" && questionResponseType.valueString !== undefined && id == subQuestionLinkId) {
                                answer = questionResponseType.valueString;
                                wicQAndA.push({
                                    ID: id,
                                    groupID: groupID,
                                    question: questionAsked,
                                    answer: answer,
                                    responseChoices: "",
                                    responseChoiceCodes: "",
                                    responseType: questionType
                                });
                            }
                            if (questionType == "integer" && questionResponseType.valueInteger !== undefined && id == subQuestionLinkId ) {
                                for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                    for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                        codes.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].code);
                                        options.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].display);
                                    }
                                    answer = questionResponseType.valueInteger;
                                    wicQAndA.push({
                                        ID: id,
                                        groupID: groupID,
                                        question: questionAsked,
                                        answer: answer,
                                        responseChoices: options,
                                        responseChoiceCodes: codes,
                                        responseType: questionType
                                    });
                                }
                            }
                            //endregion
                        }
                    }

                    //FIX ME: This was done just to get things to show and there is a lot of repetitive code

                    wicSurvey.append($("<div></div>")
                        .html("<hr>")
                        .attr("id", "wic-questionnaire-title-div")
                        .append($("<h1></h1>")
                            .addClass("text-center text-muted btn-group-sm")
                            .html("WIC Questionnaire Response")
                        )
                    );
                    var leftDiv = $("<div></div>")
                        .addClass("col-xs-5 form-group")
                        .attr("id", "leftDiv");

                    var rightDiv = $("<div></div>")
                        .addClass("col-xs-offset-7 form group")
                        .attr("id", "rightDiv");

                    var linkID1Form = $("<form></form>")
                        .addClass("row col-xs-12 form-horizontal")
                        .attr("role", "form");

                    var linkID2Form = $("<form></form>")
                        .addClass("row form horizontal")
                        .attr("role", "form");

                    var linkID2SelectorDiv = $("<div></div>")
                        .addClass("form-group col-xs-6");

                    var linkID2Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px");

                    var linkID3Form = $("<form></form>");

                    var linkID4Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID5Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID6Form = $("<form></form>")
                        .addClass("form horizontal")
                        .attr("role", "form");

                    var linkID6SelectorDiv = $("<div></div>")
                        .addClass("form-group col-xs-6");

                    var linkID6Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px");

                    var linkID7Form = $("<form></form>")
                        .addClass("form horizontal")
                        .attr("role", "form");

                    var linkID7SelectorDiv = $("<div></div>")
                        .addClass("form-group");

                    var linkID7Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px")
                        .css("width", "80%");

                    var linkID8Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID9Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID10Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID11Form = $("<form></form>")
                        .addClass("form horizontal")
                        .attr("role", "form");

                    var linkID11SelectorDiv = $("<div></div>")
                        .addClass("form-group");

                    var linkID11Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px")
                        .css("width", "80%");

                    var linkID12Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID13Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID14Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID15Form = $("<form></form>")
                        .addClass("row col-xs-12 form-horizontal")
                        .attr("role", "form");

                    var linkID16Form = $("<div></div>")
                        .addClass("form-group");

                    for (var i = 0; i < questionGroups.length; i++) {
                        for (var j = 0; j < wicQAndA.length; j++) {

                            //region LinkID1
                            if (questionGroups[i].groupID == 1 && wicQAndA[j].groupID == 1) {
                                if (wicQAndA[j].responseType == "boolean") {
                                    var questionID = parseFloat(wicQAndA[j].ID).toFixed(1);

                                    var linkID1Title = $("<div></div>")
                                        .attr("id", "linkID1-title-div")
                                        .append($("<h4></h4>")
                                            .html(questionGroups[i].Topic)
                                        );
                                    var _linkID1 = $("<div></div>")
                                        .addClass("checkbox")
                                        .append($("<input>")
                                            .attr("id", "linkID: " + wicQAndA[j].ID)
                                            .attr("type", "checkbox")
                                            .attr("disabled", true)
                                            .prop("checked", wicQAndA[j].answer)
                                            .css("padding", "1px")
                                            .css("width", "60px")
                                            .css("height", "30px")
                                        )
                                        .append($("<p></p>")
                                            .css("padding", "5px 3px 0px 55px")
                                            .attr("id", "linkID: " + wicQAndA[j].ID)
                                            .html(wicQAndA[j].question)
                                        );
                                }
                                if (wicQAndA[j].responseType == "text") {
                                    var answerID =  wicQAndA[j].ID;
                                    var _linkID1a = $("<textarea></textarea>")
                                        .addClass("form-control")
                                        .attr("disabled", true)
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("margin-left", "30px")
                                        .css("height", "20px");
                                }
                                var adjustedQuestionID = (Number(questionID)+0.1).toFixed(parseInt(1));

                                if (Number(answerID) == adjustedQuestionID) {
                                    _linkID1.append(_linkID1a);
                                }
                            }
                            linkID1Form.append(_linkID1);
                            //endregion

                            //region LinkID2

                            if (questionGroups[i].groupID == 2 && wicQAndA[j].groupID == 2) {

                                var linkID2Title = $("<div></div>")
                                    .attr("id", "linkID2-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                if (wicQAndA[j].responseType == "boolean") {
                                    for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                        var _linkID2 = $("<option></option>")
                                            .addClass("form-control")
                                            .attr("multiple", "")
                                            .prop("selected", wicQAndA[j].answer)
                                            .attr("disabled", "disabled")
                                            .css("border", "0px")
                                            .css("outline", "0px")
                                            .css("width", "80%")
                                            .html(wicQAndA[j].question);
                                    }
                                }
                                if (wicQAndA[j].responseType == "text") {
                                    var _linkID2Text = $("<div></div>")
                                        .addClass("form-group col-xs-offset-7")
                                        .append($("<label></label>")
                                            .attr("for", "other")
                                            .html(wicQAndA[j].question)
                                            .append($("<textarea></textarea>")
                                                .addClass("form-control")
                                                .attr("rows", "7")
                                                .attr("id", "other")
                                                .attr("placeholder", wicQAndA[j].answer)
                                                .attr("disabled", true)
                                            )
                                        );
                                }
                            }
                            linkID2Selector.append(_linkID2);
                            linkID2SelectorDiv.append(linkID2Selector);
                            linkID2Form.append(linkID2SelectorDiv);
                            linkID2Form.append(_linkID2Text);
                            //endregion

                            //region LinkID3

                            if(questionGroups[i].groupID == 3 && wicQAndA[j].groupID == 3) {
                                var linkID3Title = $("<div></div>")
                                    .attr("id", "linkID3-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID3 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID3Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .addClass("form-group")
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "selected-choice")
                                            .attr("for", "linkID3Radio" + wicQAndA[j].ID +"selected")
                                            .html(wicQAndA[j].responseChoices[0])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"selected")
                                                .prop("checked", true)
                                            )
                                        )
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "selected-choice")
                                            .attr("for", "linkID3Radio"+wicQAndA[j].ID+"notselected")
                                            .html(wicQAndA[j].responseChoices[1])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"selected")
                                            )
                                        );
                                } else {
                                    linkID3Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .addClass("form-group")
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "notselected-choice")
                                            .attr("for", "linkID3Radio" + wicQAndA[j].ID +"notselected")
                                            .html(wicQAndA[j].responseChoices[0])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"notselected")
                                            )
                                        )
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "selected-choice")
                                            .attr("for", "linkID3Radio"+wicQAndA[j].ID+"selected")
                                            .html(wicQAndA[j].responseChoices[1])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"selected")
                                                .prop("checked", true) //FIX ME
                                            )
                                        );
                                }
                                _linkID3.append(linkID3Radio);
                            }
                            linkID3Form.append(_linkID3);
                            //endregion

                            //region LinkID4
                            if (questionGroups[i].groupID == 4 && wicQAndA[j].groupID == 4) {
                                var linkID4Title = $("<div></div>")
                                    .attr("id", "linkID4-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID4 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID4Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID4Radio" + wicQAndA[j].ID +"selected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID4Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID4Radio"+wicQAndA[j].ID+"notselected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID4Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else {
                                    linkID4Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID4Radio" + wicQAndA[j].ID +"notselected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID4Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID4Radio"+wicQAndA[j].ID+"selected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID4Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID4.append(linkID4Radio);
                            }
                            linkID4Form.append(_linkID4);
                            //endregion

                            //region LinkID5
                            if (questionGroups[i].groupID == 5 && wicQAndA[j].groupID == 5) {
                                var linkID5Title = $("<div></div>")
                                    .attr("id", "linkID5-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID5 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");


                                if (wicQAndA[j].answer == 1) {
                                    var linkID5Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID5Radio" + wicQAndA[j].ID +"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else if (wicQAndA[j].answer == 2){
                                    linkID5Radio =  $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio" + wicQAndA[j].ID +"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else if (wicQAndA[j].answer == 3) {
                                    linkID5Radio =  $("<div></div>")
                                        .attr("id", "third-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio" + wicQAndA[j].ID +"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID5.append(linkID5Radio);
                            }
                            linkID5Form.append(_linkID5);
                            //endregion

                            //region LinkID6
                            if (questionGroups[i].groupID == 6 && wicQAndA[j].groupID == 6) {

                                var linkID6Title = $("<div></div>")
                                    .attr("id", "linkID6-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                if (wicQAndA[j].responseType == "boolean") {
                                    for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                        var _linkID6 = $("<option></option>")
                                            .addClass("form-control")
                                            .attr("multiple", "")
                                            .prop("selected", wicQAndA[j].answer)
                                            .attr("disabled", "disabled")
                                            .css("border", "0px")
                                            .css("outline", "0px")
                                            .css("width", "80%")
                                            .html(wicQAndA[j].question);
                                    }
                                }
                                if (wicQAndA[j].responseType == "text") {
                                    var _linkID6Text = $("<div></div>")
                                        .addClass("form-group col-xs-offset-7")
                                        .append($("<label></label>")
                                            .attr("for", "other")
                                            .html(wicQAndA[j].question)
                                            .append($("<textarea></textarea>")
                                                .addClass("form-control")
                                                .attr("rows", "7")
                                                .attr("id", "other")
                                                .attr("placeholder", wicQAndA[j].answer)
                                                .attr("disabled", true)
                                            )
                                        );
                                }
                            }
                            linkID6Selector.append(_linkID6);
                            linkID6SelectorDiv.append(linkID6Selector);
                            linkID6Form.append(linkID6SelectorDiv);
                            linkID6Form.append(_linkID6Text);
                            //endregion

                            //region LinkID7
                            if (questionGroups[i].groupID == 7 && wicQAndA[j].groupID == 7) {

                                var linkID7Title = $("<div></div>")
                                    .attr("id", "linkID7-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                    var _linkID7 = $("<option></option>")
                                        .addClass("form-control text-center col-xs-offset-1")
                                        .attr("multiple", "")
                                        .prop("selected", wicQAndA[j].answer)
                                        .attr("disabled", "disabled")
                                        .css("border", "0px")
                                        .css("outline", "0px")
                                        .css("width", "80%")
                                        .html(wicQAndA[j].question);
                                }
                            }
                            linkID7Selector.append(_linkID7);
                            linkID7SelectorDiv.append(linkID7Selector);
                            linkID7Form.append(linkID7SelectorDiv);
                            //endregion

                            //region linkID8
                            if (questionGroups[i].groupID == 8 && wicQAndA[j].groupID == 8) {
                                var linkID8Title = $("<div></div>")
                                    .attr("id", "linkID8-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID8 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID8Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID8Radio" + wicQAndA[j].ID +"selected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID8Radio"+wicQAndA[j].ID+"notselected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else {
                                    linkID8Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID8Radio" + wicQAndA[j].ID +"notselected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID8Radio"+wicQAndA[j].ID+"selected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID8.append(linkID8Radio);
                            }
                            linkID8Form.append(_linkID8);
                            //endregion

                            //region linkID9
                            if (questionGroups[i].groupID == 9 && wicQAndA[j].groupID == 9) {
                                var linkID9Title = $("<div></div>")
                                    .attr("id", "linkID9-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var linkID9 = $("<label></label>")
                                    .attr("for", "linkID"+wicQAndA[j].ID+"textfield")
                                    .css("width", "80%")
                                    .html(wicQAndA[j].question + "<br>")
                                    .append($("<input>")
                                        .addClass("form-control")
                                        .attr("type", "text")
                                        .attr("disabled", true)
                                        .attr("id", "linkID"+wicQAndA[j].ID+"textfield")
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("width", "100%")
                                    )

                            }
                            linkID9Form.append(linkID9);
                            //endregion

                            //region linkID10
                            if (questionGroups[i].groupID == 10 && wicQAndA[j].groupID  == 10) {
                                var linkID10Title = $("<div></div>")
                                    .attr("id", "linkID10-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID10 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID10Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID10Radio" + wicQAndA[j].ID +"selected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID10Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID10Radio"+wicQAndA[j].ID+"notselected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID10Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else {
                                    linkID10Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID4Radio" + wicQAndA[j].ID + "notselected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type", "radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID10Radio" + wicQAndA[j].ID + "notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID10Radio" + wicQAndA[j].ID + "selected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type", "radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID10Radio" + wicQAndA[j].ID + "selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID10.append(linkID10Radio);
                            }
                            linkID10Form.append(_linkID10);
                            //endregion

                            //region linkID11
                            if (questionGroups[i].groupID == 11 && wicQAndA[j].groupID == 11) {

                                var linkID11Title = $("<div></div>")
                                    .attr("id", "linkID11-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                    var _linkID11 = $("<option></option>")
                                        .addClass("form-control text-center col-xs-offset-1")
                                        .attr("multiple", "")
                                        .prop("selected", wicQAndA[j].answer)
                                        .attr("disabled", "disabled")
                                        .css("border", "0px")
                                        .css("outline", "0px")
                                        .css("width", "80%")
                                        .html(wicQAndA[j].question);
                                }
                            }
                            linkID11Selector.append(_linkID11);
                            linkID11SelectorDiv.append(linkID11Selector);
                            linkID11Form.append(linkID11SelectorDiv);
                            //endregion

                            //region linkID12
                            if (questionGroups[i].groupID == 12 && wicQAndA[j].groupID == 12) {
                                var linkID12Title = $("<div></div>")
                                    .attr("id", "linkID12-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID12 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");


                                if (wicQAndA[j].answer == 1) {
                                    var linkID12Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline text-center")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID12Radio" + wicQAndA[j].ID +"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else if (wicQAndA[j].answer == 2){
                                    linkID12Radio =  $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio" + wicQAndA[j].ID +"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else if (wicQAndA[j].answer == 3) {
                                    linkID12Radio =  $("<div></div>")
                                        .attr("id", "third-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio" + wicQAndA[j].ID +"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID12.append(linkID12Radio);
                            }
                            linkID12Form.append(_linkID12);
                            //endregion

                            //region linkID13
                            if (questionGroups[i].groupID == 13 && wicQAndA[j].groupID == 13) {
                                var linkID13Title = $("<div></div>")
                                    .attr("id", "linkID13-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var linkID13 = $("<label></label>")
                                    .attr("for", "linkID"+wicQAndA[j].ID+"textfield")
                                    .css("width", "80%")
                                    .html(wicQAndA[j].question + "<br>")
                                    .append($("<input>")
                                        .addClass("form-control")
                                        .attr("type", "text")
                                        .attr("disabled", true)
                                        .attr("id", "linkID"+wicQAndA[j].ID+"textfield")
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("width", "100%")
                                    )

                            }
                            linkID13Form.append(linkID13);
                            //endregion

                            //region linkID14
                            if (questionGroups[i].groupID == 14 && wicQAndA[j].groupID == 14) {
                                var linkID14Title = $("<div></div>")
                                    .attr("id", "linkID8-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID14 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID14Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID14Radio" + wicQAndA[j].ID +"selected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID14Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID14Radio"+wicQAndA[j].ID+"notselected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID14Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else {
                                    linkID14Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID14Radio" + wicQAndA[j].ID +"notselected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID14Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID14Radio"+wicQAndA[j].ID+"selected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID14Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID14.append(linkID14Radio);
                            }
                            linkID14Form.append(_linkID14);
                            //endregion

                            //region linkID15
                            if (questionGroups[i].groupID == 15 && wicQAndA[j].groupID == 15) {
                                if (wicQAndA[j].responseType == "boolean") {
                                    var linkID15QuestionID = parseFloat(wicQAndA[j].ID).toFixed(1);

                                    var linkID15Title = $("<div></div>")
                                        .attr("id", "linkID15-title-div")
                                        .append($("<h4></h4>")
                                            .html(questionGroups[i].Topic)
                                        );
                                    var _linkID15 = $("<div></div>")
                                        .addClass("checkbox")
                                        .append($("<input>")
                                            .attr("id", "linkID: " + wicQAndA[j].ID)
                                            .attr("type", "checkbox")
                                            .attr("disabled", true)
                                            .prop("checked", wicQAndA[j].answer)
                                            .css("padding", "1px")
                                            .css("width", "60px")
                                            .css("height", "30px")
                                        )
                                        .append($("<p></p>")
                                            .css("padding", "5px 3px 0px 55px")
                                            .attr("id", "linkID: " + wicQAndA[j].ID)
                                            .html(wicQAndA[j].question)
                                        );
                                }
                                if (wicQAndA[j].responseType == "text") {
                                    var linkID15AnswerID =  wicQAndA[j].ID;
                                    var _linkID15a = $("<textarea></textarea>")
                                        .addClass("form-control")
                                        .attr("disabled", true)
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("margin-left", "30px")
                                        .css("height", "20px");
                                }
                                var linkID15AdjustedQuestionID = (Number(questionID)+0.1).toFixed(parseInt(1));

                                if (Number(linkID15AnswerID) == linkID15AdjustedQuestionID) {
                                    _linkID15.append(_linkID15a);
                                }
                            }
                            linkID15Form.append(_linkID15);
                            //endregion

                            //region linkID16
                            if (questionGroups[i].groupID == 16 && wicQAndA[j].groupID == 16) {
                                var linkID16Title = $("<div></div>")
                                    .attr("id", "linkID16-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var linkID16 = $("<label></label>")
                                    .attr("for", "linkID"+wicQAndA[j].ID+"textfield")
                                    .css("width", "80%")
                                    .html(wicQAndA[j].question + "<br>")
                                    .append($("<input>")
                                        .addClass("form-control")
                                        .attr("type", "text")
                                        .attr("disabled", true)
                                        .attr("id", "linkID"+wicQAndA[j].ID+"textfield")
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("width", "100%")
                                    )

                            }
                            linkID16Form.append(linkID16);
                            //endregion

                        }
                    }

                    leftDiv.append(linkID1Title)
                        .append(linkID1Form)
                        .append(linkID2Title)
                        .append(linkID2Form)
                        .append(linkID3Title)
                        .append(linkID3Form)
                        .append(linkID4Title)
                        .append(linkID4Form)
                        .append(linkID5Title)
                        .append(linkID5Form)
                        .append(linkID6Title)
                        .append(linkID6Form);

                    rightDiv.append(linkID7Title)
                        .append(linkID7Form)
                        .append(linkID8Title)
                        .append(linkID8Form)
                        .append(linkID9Title)
                        .append(linkID9Form)
                        .append(linkID10Title)
                        .append(linkID10Form)
                        .append(linkID11Title)
                        .append(linkID11Form)
                        .append(linkID12Title)
                        .append(linkID12Form)
                        .append(linkID13Title)
                        .append(linkID13Form)
                        .append(linkID14Title)
                        .append(linkID14Form)
                        .append(linkID15Title)
                        .append(linkID15Form)
                        .append(linkID16Title)
                        .append(linkID16Form);

                    wicSurvey.append(leftDiv);
                    wicSurvey.append(rightDiv);

                }
                else {
                    $("#dialog").append("<div id='physician-questionnaire-blank'>The patient has not completed the WIC questionnaire.</div>");
                }
                $("#dialog").dialog("open");
            });
        });

        $('#patient-update-button').click(NS.App.updatePatientDialog);
    }

    NS.PhysicianView =
    {
        render : function()
        {

            renderPhysicianView("#view-physician");

        }
    };

    // FIXME: Antipattern alert, probably not a great idea to pass the entire form, but
    // that simplifies subtree selection for manipulating the DOM to add/show errors.

    GC.App.UpdatePatient = function(updateForm) {
        // From the requirements, it seems like CDC is expecting BMI to be automatically
        // calculated everywhere. Unfortunately, this is not the case - and fixing that in
        // every place where it's referenced requires an abstract concept called motivation,
        // which I seem to be lacking at. So we log BMI into FHIR here, so the rest of the app
        // does not break. Whoever you are - the poor soul reading this comment, I am sorry.

        var hadErrors = false;

        $('.update-patient-warning').css('display', 'none');

        var weight = parseFloat(updateForm.querySelector('#updateWeight').value);
        var height = parseFloat(updateForm.querySelector('#updateHeight').value);
        var hemo = parseFloat(updateForm.querySelector('#updateHemo').value);

        if (isNaN(weight)) {
            updateForm.querySelector('#weight-warning').style.display = 'block';
            hadErrors = true;
        }

        if (isNaN(height)) {
            updateForm.querySelector('#height-warning').style.display = 'block';
            hadErrors = true;
        }

        if (isNaN(hemo)) {
            updateForm.querySelector('#hemo-warning').style.display = 'block';
            hadErrors = true;
        }

        if (hadErrors) {
            return false;
        }

        var bmi = (weight / Math.pow(height / 100, 2)).toFixed(2);
        var synchronizedTime = new Date().toISOString().substring(0, 19);

        var observation = function(c, d, e, p, v, u) {
            return {
                "resourceType": 'Observation',
                "status": "final",
                "code":{
                    "coding": [
                        { "system":"http://loinc.org", "code": c, "display": d }
                    ]
                },
                "subject": {
                    "reference": "Patient/" + window.sessionStorage.getItem('patientid_global'),
                    "display": document.querySelector('#patient-fullname strong').innerText
                },
                "encounter":{
                    "display": e
                },
                "effectiveDateTime": synchronizedTime,
                "performer":[
                    { "display": p }
                ],
                "valueQuantity":{
                    "value": v,
                    "unit": u
                }
            };
        };

        var fhir = FHIR.client({
          serviceUrl: window.sessionStorage.getItem('fhir_url_global'),
          patientId:  window.sessionStorage.getItem('patientid_global'),
            auth: { type: 'none' }
        });

        var logID = function(id) { console.log('FHIR Resource created: ' + id); };

        var ep = GC.App.nutritionistMode ? 'WIC' : 'MD';
        var url = window.sessionStorage.getItem('fhir_url_global') + '/Observation';

        var fhirHeaders = new Headers();
        fhirHeaders.append("Content-Type", "application/json");

        $('#update-patient-submit').hide('fast');
        $('#update-patient-processing').hide('fast');

        var done = 0;
        var maybeFinish = function() {
            done++;

            if (done >= 4) {
                window.setTimeout(function(e) {
                    $('#update-patient-processing').hide('fast');
                    $('#update-patient-submit').hide('fast');
                    $('.ui-icon-closethick').click();
                }, 200);
            }
        }

        fetch(url, { method: 'POST', mode: 'cors', cache: 'default', headers: fhirHeaders,
                     body: JSON.stringify(observation('8302-2', 'Height', ep, ep, height, 'cm'))})
            .then(function(e) {
                $('#patient-height .recordedValue').text(height);
                maybeFinish();
            })
            .catch(function(e) { alert(e) });

        fetch(url, { method: 'POST', mode: 'cors', cache: 'default', headers: fhirHeaders,
                     body: JSON.stringify(observation('3141-9', 'Weight', ep, ep, weight, 'kg'))})
            .then(function(e) {
                $('#patient-weight .recordedValue').text(weight);
                maybeFinish();
            })
            .catch(function(e) { alert(e) });

        fetch(url, { method: 'POST', mode: 'cors', cache: 'default', headers: fhirHeaders,
                     body: JSON.stringify(observation('39156-5', 'BMI', ep, ep, bmi, 'kg/m2'))})
            .then(function(e) {
                $('#patient-BMI .recordedValue').text(bmi);
                maybeFinish();
            })
            .catch(function(e) { alert(e) });

        fetch(url, { method: 'POST', mode: 'cors', cache: 'default', headers: fhirHeaders,
                     body: JSON.stringify(observation('718-7', 'Hemoglobin', ep, ep, hemo, 'mg/dL'))})
            .then(function(e) {
                $('#patient-hemo .recordedValue').text(hemo);
                maybeFinish();
            })
            .catch(function(e) { alert(e) });

        return false;
    };

    $(function()
    {
        if (!PRINT_MODE)
        {

            $("html").bind("set:viewType set:language", function(e)
            {
                if (isPhysicianViewVisible())
                {
                    renderPhysicianView("#view-physician");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e)
            {
                if (isPhysicianViewVisible())
                {
                    renderPhysicianView("#view-physician");
                }
            });

            GC.Preferences.bind("set", function(e)
            {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std")
                {
                    if (isPhysicianViewVisible())
                    {
                        renderPhysicianView("#view-physician");
                    }
                }
            });

            GC.Preferences.bind("set:timeFormat", function(e)
            {
                renderPhysicianView("#view-physician");
            });
        }
    });

}(GC, jQuery));