/*global
Chart, GC, PointSet, Raphael, console, $,
jQuery, debugLog,
XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/




(function (NS, $) {

    "use strict";



    /*
    From Functional requiements:

    Underweight: ICD-10 code: Z68.51
    Normal Weight: ICD-10 code:  Z68.52
    Overweight: ICD-10 code: Z68.53
    Obese: ICD-10 code: Z68.54
    Counseling for Nutrition (ICD-10 code: Z71.3)  (if healthy habits assessment reviewed, Rx printed or Goal set)
    Counseling, other, including physical activity (ICD-10 code: Z71.89)  (same as above)
    */

    var coding_data = {
        'Z68.51': 'ICD-10 Underweight',
        'Z68.52': 'ICD-10 Normal Weight',
        'Z68.53': 'ICD-10 Overweight',
        'Z68.54': 'ICD-10 Obese',
        'Z71.3': 'ICD-10 Counseling  for nutrition',
        'Z71.89': 'ICD-10 Counseling  for physical activity'
    }

    var refer_data = {
        'WIC': 'WIC',
        'Endocrinologist': 'Endocrinologist',
        'Community Nutrition Resources': 'Community Nutrition Resources',
        'Community Physical Activity Resources': 'Community Physical Activity Resources'

    }

    // window.sessionStorage.setItem('fhir_url_global','http://52.72.172.54:8080/fhir/baseDstu2' );
    var fhir_url = window.sessionStorage.getItem('fhir_url_global') + '/';

    var patientID = window.sessionStorage.getItem('patientid_global');

    var recommendation_host = "https://fhirtesting.hdap.gatech.edu/HealthWeightRecommendation";

    var PatientCareCoordinatorID = window.sessionStorage.getItem('PatientCareCoordinatorID_global');

    var MD_ID = window.sessionStorage.getItem('MD_ID_global');

    var food_insecurity_questions_id = window.sessionStorage.getItem('food_insecurity_questions_id_global');

    var refreq_ID = 0;

    var whatAbout = "";

    var ICD_codes = "";

    var selected_Codes = new Array();

    var selected_referals = new Array();

    var InsecurityQuestionnaire = "";

    var InsecurityQuestionnaireResponce = "";

    var InsecurityQAndA = [];



    var InsecurityQuestionnaireCall = (function () {
        var InsecurityQuestionnaireCall = null;
        $.ajax({
            async: false,
            global: false,
            url: fhir_url + 'Questionnaire?_id=' + food_insecurity_questions_id,
            dataType: 'json',
            success: function (data) {
                InsecurityQuestionnaireCall = data;
            }
        });

        return InsecurityQuestionnaireCall;
    })();


    $.when(InsecurityQuestionnaireCall).then(function () {
        if (InsecurityQuestionnaireCall.entry) {
            InsecurityQuestionnaire = InsecurityQuestionnaireCall.entry[0].resource;

            console.log("InsecurityQuestionnaire id " + InsecurityQuestionnaire.id + " patientid = " + patientID);
            console.log(InsecurityQuestionnaire);
        }

        //http://52.72.172.54:8080/fhir/baseDstu2/QuestionnaireResponse?patient=1081176&questionnaire=1081183
        var QuestionnaireResponseCall = (function () {
            var QuestionnaireResponseCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'QuestionnaireResponse?patient=' + patientID + "&questionnaire=" + InsecurityQuestionnaire.id,
                dataType: 'json',
                success: function (data) {
                    QuestionnaireResponseCall = data;
                }
            });

            return QuestionnaireResponseCall;
        })();


        $.when(QuestionnaireResponseCall).then(function () {
            if (QuestionnaireResponseCall.entry) {
                //still just a list  of all QRs ever at this point, must drill down into it,  search the list for Insecurity responces and find the latest one
                InsecurityQuestionnaireResponce = QuestionnaireResponseCall.entry[0].resource;
                console.log(InsecurityQuestionnaireResponce);

                if (InsecurityQuestionnaireResponce) {
                    if (InsecurityQuestionnaireResponce.meta) {
                        var InsecurityQuestionnaireResponceLastUpdated = (InsecurityQuestionnaireResponce.meta.lastUpdated ? InsecurityQuestionnaireResponce.meta.lastUpdated.split("T") : "");
                        console.log("InsecurityQuestionnaireResponceLastUpdated = " + InsecurityQuestionnaireResponceLastUpdated);
                    }



                    for (var i = 0; i < InsecurityQuestionnaire.group.question.length; i++) {
                        //search for validated by LinkId final answer
                        var question_link_ID = InsecurityQuestionnaire.group.question[i].linkId;
                        var qr_index = -1;
                        for (var x = 0; x < InsecurityQuestionnaireResponce.group.question.length; x++) {
                            if (question_link_ID == InsecurityQuestionnaireResponce.group.question[x].linkId) {
                                qr_index = x;
                                break;
                            }
                        }

                        if (qr_index == -1) {
                            console.log("ERROR: could not validate linkId of question to any existing LinkID in the questionnaire-response");
                            return;
                        }

                        var final_answer = InsecurityQuestionnaireResponce.group.question[qr_index].answer[0].valueBoolean;
                        InsecurityQAndA.push({ question: (InsecurityQuestionnaire.group.question[qr_index].text), answer: final_answer });
                    }
                    console.log(InsecurityQAndA);

                }
            }
        });
    });





    var selectedIndex = -1,

        /**
         * The cached value from GC.App.getMetrics()
         */
        metrics = null,

        PRINT_MODE = $("html").is(".before-print"),

        EMPTY_MARK = PRINT_MODE ? "" : "&#8212;",

        MILISECOND = 1,
        SECOND = MILISECOND * 1000,
        MINUTE = SECOND * 60,
        HOUR = MINUTE * 60,
        DAY = HOUR * 24,
        WEEK = DAY * 7,
        MONTH = WEEK * 4.348214285714286,
        YEAR = MONTH * 12,

        shortDateFormat =
            {
                "Years": "y",
                "Year": "y",
                "Months": "m",
                "Month": "m",
                "Weeks": "w",
                "Week": "w",
                "Days": "d",
                "Day": "d",
                separator: " "
            };




    function isPhysicianReferralVisible() {
        return GC.App.getViewType() == "referral";
    }




    var ReferralPOST = function (forWhat) {
        var currentTime = new Date();
        var json_ReferralRequest_data =
            {

                "resourceType": "ReferralRequest",
                "text": {
                    "status": "generated",
                    "div": "<div>referralRequest to Care Coordinator Team for Patient/" + patientID + " for " + forWhat + "</div>"
                },
                "status": "pending",
                "type": {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "700274009",
                            "display": "Referral for procedure"
                        }
                    ]
                },
                "specialty": {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "710915002",
                            "display": "Referral to community service"
                        }
                    ]
                },
                "priority": {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "394848005",
                            "display": "Normal priority"
                        }
                    ]
                },
                "patient": {
                    "reference": "Patient/" + patientID,
                    "display": "Clark Kent"
                },
                "requester": {
                    "display": "Serena Shrink",
                    "reference": "Organization/" + MD_ID,
                },
                "recipient": [
                    {
                        "reference": "Organization/" + PatientCareCoordinatorID,
                        "display": "Care Coordinator Team "
                    }
                ],
                "dateSent": currentTime,
                "reason": {
                    "coding": [
                        {

                            "system": "http://hl7.org/fhir/sid/icd-10-cm",
                            "code": ICD_codes,
                            "display": "Childhood obesity"
                        }
                    ]
                },
                "description": " for childhood obesity for community cooordination. " + whatAbout,
                "serviceRequested": [
                    {
                        "coding": [
                            {
                                "system": "http://hl7.org/fhir/sid/icd-10-cm",
                                "code": ICD_codes,
                                "display": "community care   for childhood obesity"
                            }
                        ]
                    }
                ]
            }


        var ReferralPOST = null;
        $.ajax({
            type: 'POST',
            async: false,
            global: false,
            url: fhir_url + 'ReferralRequest',
            data: JSON.stringify(json_ReferralRequest_data),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                ReferralPOST = data;
                alert(ReferralPOST.issue[0].diagnostics + " for childhood obesity for community cooordination. " + whatAbout);
                var value = ReferralPOST.issue[0].diagnostics;
                var num = value.match(/\d+/g);
                refreq_ID = num[0];

                CoordinatorCommunicationPOST();
            },

        });

        return ReferralPOST;
    };





    //used to POST a communication  to the community coordinator
    var CoordinatorCommunicationPOST = function () {
        var currentTime = new Date();
        var json_communication_to_community_coordinator_data =
            {
                "resourceType": "Communication",
                "text": {
                    "status": "generated",
                    "div": "<div>a referralRequest has been sent to the childhood obesity patient coordinator </div>"
                },


                "category": {
                    "coding": [
                        {
                            "system": "http://acme.org/messagetypes",
                            "code": "notification"
                        }
                    ],
                    "text": "notification"
                },
                "sender": {
                    "display": "Serena Shrink",
                    "reference": "Organization/" + MD_ID,

                },
                "recipient": [
                    {
                        "reference": "Organization/" + PatientCareCoordinatorID,
                        "display": "Care Coordinator Team "
                    }
                ],
                "payload": [
                    {
                        "contentString": " referralRequest for Patient/" + patientID
                    },
                    {
                        "contentReference": {
                            "fhir_comments": [
                                " Reference to the referralRequest "
                            ],
                            "reference": "ReferralRequest/" + refreq_ID
                        }
                    }
                ],
                "status": "in-progress",
                "sent": currentTime,
                "subject": {
                    "reference": "Patient/" + patientID
                }
            }

        var CoordinatorCommunicationPOST = null;
        $.ajax({

            type: 'POST',
            async: false,
            global: false,
            url: fhir_url + 'Communication',
            data: JSON.stringify(json_communication_to_community_coordinator_data),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                CoordinatorCommunicationPOST = data;

                console.log(json_communication_to_community_coordinator_data);
                console.log(CoordinatorCommunicationPOST);
                alert(CoordinatorCommunicationPOST.issue[0].diagnostics);

            }
        });
        return CoordinatorCommunicationPOST;
    };

    function renderPhysicianReferral(container) {

        $(container).empty();

        var str = '                                                                                                           '
            + '        <style>                                                                                                    '
            + '          #labAndRefferal {  width:100%;margin-left:-1px;font-family: Tahoma, sans-serif; font-size: 12px;border: 10px solid #728391;border-radius: 10px; margin-top: 10px; }                                   '
            + '          #title {  margin-right:-15px;margin-left:-15px;font-size:x-large;padding: .5em;color: white;clear: left;text-align: center; background-color:#728391; }                                   '
            + '          ol { border:1px solid black; }                                                                           '
            + '          ol .ui-selecting { background: #99ffff; }                                                                '
            + '          ol .ui-selected { background: #00ffff; }                                                                 '
            + '          ol { list-style-type: none;  }                                                                           '
            + '          ol li { padding: 0.4em; font-size: 1.3em; padding-bottom:10px}                             '
            + '          h1    { font-weight: bold; text-align: center;}                                                          '
            + '          #btn-send {  font-weight: bold;top:90%;}                                                                 '
            + '          .row {margin-bottom: 20px; max-width: 1170px}                                                            '
            + '          .row .row { margin-top: 10px; margin-bottom: 0;}                                                         '
            + '           [class*="col-"] {padding-top: 10px;padding-bottom: 5px;}                                               '
            + '        </style>                                                                                                   '



            + '        <div class="container" id="labAndRefferal">                                                                '
            + '<div id="title"> '
            + 'Referrals'
            + '    </div>     '
            + '            <div class="row">                                                                                      '
            + '                <div class="col-sm-4">                                                                             '
            + '                   <div class="col-sm-10" id="refer-to" ></div>                                                    '
            + '                   <div class="col-sm-12 fi_form" id="food-insecurity-form" style="display:none" >                 '
            + '                   </div>                                                                                          '
            + '                </div>                                                                                             '
            + '                <div class="col-sm-6">                                                                             '
            + '                    <div class="col-sm-10" id="sugested-coding" ></div>                                            '
            + '                    <div class="col-sm-offset-3 col-sm-4" id="btn-send" >                                          '
            + '                        <button type="button" class="btn btn-primary" id="RefBtn">Send Referral &raquo; </button>  '
            + '                    </div>                                                                                         '
            + '                </div>                                                                                             '
            + '            </div>                                                                                                 '
            + '<div id="title"> '
            + 'Recommendations'
            + '    </div>     '
            + '            <div  id="recommendation" style="margin-top: 15px;margin-bottom:15px" >                                                                            '
            + '                <div style="font-size: 18px; color: #4F5F6B;">                                                     '
            + '                    Send                                                                                           '
            + '                    <select id="messageMethod">                                                                    '
            + '                        <option>email</option>                                                                     '
            + '                        <option>text</option>                                                                      '
            + '                    </select> message recommending                                                                 '
            + '                    <select id="messageType">                                                                      '
            + '                        <option>farmers markets</option>                                                           '
            + '                        <option>parks</option>                                                                     '
            + '                    </select> for zip code                                                                         '
            + '                    <input type="text" id="zipCode" placeholder="Zip Code" /> to                                   '
            + '                    <input type="text" id="messageDestination" placeholder="Email Address" />.                     '
            + '                    <button id="sendMessageButton" class="btn btn-primary">Send Recommendation &raquo;</button>                           '
            + '                </div>                                                                                             '
            + '            </div>                                                                                                 '
            + '        </div>                                                                                                     ';


        $(container).append(str);
        var root = $("#labAndRefferal");


        $('#food-insecurity-form').html('<p style="font-size: 24px; font-weight: bold; color: #4F5F6B;"> Food Insecurity: </p>');


        for (var i = 0; i < InsecurityQAndA.length; i++) {
            var answer = InsecurityQAndA[i].answer;
            var question = InsecurityQAndA[i].question;

            var div_id = '"food-insecurity-Q' + i + '"';

            var ronn = '"toggle-on-n-' + i + '"';

            var roffn = '"toggle-off-n-' + i + '"';

            var ronid = '"toggle-on-id-' + i + '"';

            var roffid = '"toggle-off-id-' + i + '"';

            var radio = '    '
                + '                          <div style="font-size: 16px;" class="form-group" id=' + div_id + '  >                                             '
                + '                                    <p >' + question + '</p>                                   '
                + '                                    <input type="radio" id=' + ronid + '  name=' + ronn + ' onclick="return false;" disabled>     '
                + '                                    <label for=' + ronn + '>True </label>                                             '
                + '                                    <input type="radio" id=' + roffid + ' name=' + roffn + ' onclick="return false;" disabled>    '
                + '                                    <label for=' + roffn + '>False</label>                                            '
                + '                          </div>                                                                                  ';

            $(radio).appendTo('#food-insecurity-form');

            var name = "";
            if (answer == true)
                name = ronn;
            else
                name = roffn;

            $('input[name=' + name + ']').prop('checked', true);
        }


        function create_list(heading, ol_id_val, table, div_id, allow_other) {

            $(div_id).html('<p style="font-size: 24px; font-weight: bold; color: #4F5F6B;">' + "    " + heading + '</p>');

            var s = $('<ol />', { id: ol_id_val });
            data = table;
            for (var val in data) {
                $('<li  />', { class: 'ui-widget-content', id: val, text: data[val] }).appendTo(s);
            }
            if (allow_other) {
                $('<li><input id="ref-target-other" type="text" style="width:95%; margin:1.5pt 4pt"/></li>', { class: 'ui-widget-content' }).appendTo(s);
            }
            s.appendTo(div_id);
        }


        create_list('Suggested Coding:', 'selectableCoding', coding_data, '#sugested-coding', false);
        create_list('Refer To:', 'selectableRefer', refer_data, '#refer-to', true);


        function add_to_array(selected_id, array) {
            var index = array.indexOf(selected_id);
            if (index == -1) {
                array.push(selected_id);
            }

        }

        function remove_from_array(unselected_id, array) {
            var index = array.indexOf(unselected_id);
            if (index != -1) {
                array.splice(index, 1);
            }

        }

        $("#sendMessageButton").on('click', function () {
            var messageLink = $("#messagePreview");
            messageLink.attr("href", null);
            var method = $("#messageMethod").find(":selected").index() == 0 ? "Email" : "Sms";
            var type = $("#messageType").find(":selected").index() == 0 ? "fm" : "pk";
            var zipCode = $("#zipCode").val();
            var destination = $("#messageDestination").val();
            var data = {
                recommendationType: type,
                destination: destination,
                zipCode: zipCode,
                testMessage: true
            }
            $.post(recommendation_host + "/send" + method, data, function (result) {
                alert("You're message was sent.");
            });
        });

        $("#messageMethod").on('change', function () {
            var destination = $("#messageDestination");
            if ($("#messageMethod").find(':selected').index() == 0)
                destination.attr('placeholder', 'Email Address');
            else
                destination.attr('placeholder', 'Phone Number');
        });

        $("#selectableCoding").selectable(
            {
                selected: function (event, ui) {
                    add_to_array(ui.selected.id, selected_Codes);
                },
                unselected: function (event, ui) {
                    remove_from_array(ui.unselected.id, selected_Codes);
                }
            });



        $("#selectableRefer").selectable(
            {
                selected: function (event, ui) {
                    add_to_array(ui.selected.id, selected_referals);
                },
                unselected: function (event, ui) {
                    remove_from_array(ui.unselected.id, selected_referals);
                }
            });


        $('#RefBtn').on('click', function (event) {

            whatAbout = "ICD-10 codes are as follows: ";

            var arrayLength = selected_Codes.length;
            for (var i = 0; i < arrayLength; i++) {
                whatAbout += " , " + selected_Codes[i];
                ICD_codes = " , " + selected_Codes[i];
            }

            whatAbout += ".  Patient is refered to the following: ";
            var arrayLength = selected_referals.length;
            for (var i = 0; i < arrayLength; i++) {
                whatAbout += " , " + selected_referals[i];
            }
            if ($('#ref-target-other').val()) {
                whatAbout += " , " + $('#ref-target-other').val();
            }

            ReferralPOST("community care");


        });

        $(".btn").mouseup(function () {
            $(this).blur();
        })
    }



    NS.PhysicianReferral =
        {
            render: function () {

                renderPhysicianReferral("#view-referral");

            }
        };

    $(function () {
        if (!PRINT_MODE) {

            $("html").bind("set:viewType set:language", function (e) {
                if (isPhysicianReferralVisible()) {
                    renderPhysicianReferral("#view-referral");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function (e) {
                if (isPhysicianReferralVisible()) {
                    renderPhysicianReferral("#view-referral");
                }
            });

            GC.Preferences.bind("set", function (e) {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") {
                    if (isPhysicianReferralVisible()) {
                        renderPhysicianReferral("#view-referral");
                    }
                }
            });


            GC.Preferences.bind("set:timeFormat", function (e) {
                renderPhysicianReferral("#view-referral");
            });

        }
    });

}(GC, jQuery));
