

(function(NS, $)
{

    "use strict";

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

    function isPatientsViewVisible() {
        return GC.App.getViewType() == "patients";
    }

    function renderPatientsView( container ) {

        var current_patientID = window.sessionStorage.getItem('patientid_global');

        var Clark_id = window.sessionStorage.getItem('Clark_ID_global');

        var Kara_id = window.sessionStorage.getItem('Kara_ID_global');

        $(container).empty();

       
  
      var str = '<style>'
    +'        #birth-selector {                             '
    +'            font-family: Tahoma, sans-serif;          '
    +'            font-size: 12px;                          '
    +'        }                                             '
    +'        #birth-selector input {                       '
    +'            width: auto;                              '
    +'            height: auto;                             '
    +'            background: transparent;                  '
    +'            line-height: normal;                      '
    +'        }                                             '
    +'        #birth-selector label {                       '
    +'            white-space: nowrap;                      '
    +'            display: block;                           '
    +'            padding: 8px 2px;                         '
    +'            border: 1px solid transparent;            '
    +'            text-align: center;                       '
    +'        }                                             '
    +'        #birth-selector label:hover {                 '
    +'            background: #EEE;                         '
    +'            border-color: #DDD;                       '
    +'        }                                             '
    +'        #birth-selector #patients-list {              '
    +'            max-height: 250px;                        '
    +'            overflow: auto;                           '
    +'        }                                             '
    +'        #birth-selector input[type="button"] {        '
    +'            padding: 4px;                             '
    +'            border: 1px solid;                        '
    +'            line-height: 20px !important;             '
    +'            height: auto;                             '
    +'            font-size: 12px;                          '
    +'            font-family: Tahoma, sans-serif;          '
    +'            min-width: 80px;                          '
    +'            width: auto;                              '
    +'            border-radius: 3px !important;            '
    +'            border-color: #AAB !important;            '
    +'            color: #000;                              '
    +'            text-shadow: 0 1px 0 #FFF;                '
    +'            box-shadow: 1px 1px 0px 0px rgba(255, 255, 255, 0.5) inset, -1px -1px 3px 0px rgba(0, 0, 0, 0.05) inset;        '
    +'        }                                                                                                                   '
    +'        #birth-selector input[type="button"]:hover {                                                                        '
    +'            background: #E6EBEF;                                                                                            '
    +'            border-color: #728391 !important;                                                                               '
    +'            box-shadow: 1px 1px 0px 0px rgba(255, 255, 255, 0.95) inset, -1px -1px 3px 0px rgba(0, 0, 0, 0.2) inset;        '
    +'        }                                                                                                                   '
    +'        #birth-selector input[type="button"]:active {                                                                       '
    +'            background: #D3DBDF;                                                                                            '
    +'            border-color: #728391 !important;                                                                               '
    +'            box-shadow: -1px -1px 3px 0px rgba(255, 255, 255, 0.5) inset, 1px 1px 3px 0px rgba(0, 0, 0, 0.2) inset;         '
    +'        }                                                                                                                   '
    +'        #birth-selector input[type="button"].ui-state-disabled {                                                            '
    +'            background: #EEE;                                                                                               '
    +'            border-color: #DDD !important;                                                                                  '
    +'            box-shadow: none !important;                                                                                    '
    +'            color: #999;                                                                                                    '
    +'            opacity: 1;                                                                                                     '
    +'        }                                                                                                                   '
    +'        </style>                                                                                                            '
    +'        <div id="birth-selector">                                                                                           '
    +'            <p data-translatecontent="STR_6030"></p>                                                                        '
    +'            <br />                                                                                                          '
    +'            <p data-translatecontent="STR_6031"></p>                                                                        '
    +'            <br />                                                                                                          '
    +'            <div class="separator"></div>                                                                                   '
    +'            <div id="patients-list"></div>                                                                                  '
    +'            <div class="separator"></div>                                                                                   '
    +'            <p style="text-align: center">                                                                                  '
    +'                <input type="button" data-translateattr="value=STR_6042" value="  Continue as Provider  " class="ui-state-disabled continue-button" user-role="provider" />'
    +'                <input type="button" data-translateattr="value=STR_6042" value="  Continue as WIC  " class="ui-state-disabled continue-button" user-role="nutritionist" />'
    +'            </p>                                                                                                            '
    +'        </div>';         
        
        $(container).append(str);

        /*

        $('#patientIDform input').on('change', function() {

            var checkedValue = $('input[name="myRadio"]:checked', '#patientIDform').val();
            
            if(checkedValue !=  current_patientID)
            {
                window.sessionStorage.setItem('patientid_global',checkedValue );
                alert('A new patient, ID =' + $('input[name="myRadio"]:checked', '#patientIDform').val() + ' has been selected. Please wait a moment while new data is retrieved from the server'  ); 
                window.location.reload(true); 
                //gc_app_js(GC, jQuery);
                //GC.get_data();
                //GC.App.getPatient().refresh();
            }
        });*/
       

        var root     = $("#birth-selector");
        var list     = root.find("#patients-list");

        var hasSelection  = false;

        $.each(GC.availableSamplePatients, function(i, patient) {
            var html = [], j = 0;
            html[j++] = '<label class="' + patient.gender + '">';
            if(i == 0  && current_patientID == Clark_id)
            {

                html[j++] = '<input type="radio" name="patient-index" value="' + i + '" checked/>';
            }
            else
            if(i == 0  && current_patientID != Clark_id)
            {

                html[j++] = '<input type="radio" name="patient-index" value="' + i + '" />';
            }
            else

            if(i == 1  && current_patientID == Kara_id)
            {
                html[j++] = '<input type="radio" name="patient-index" value="' + i + '" checked/>';
            }
            else
            if(i == 1  && current_patientID != Kara_id)
            {

                html[j++] = '<input type="radio" name="patient-index" value="' + i + '" />';
            }

            html[j++] = '&nbsp;' + patient.name + " (";
            html[j++] = '&nbsp;<span class="gender-bg" style="padding:1px 6px;border-radius:50px">' + patient.gender + "</span>";
            html[j++] = ',&nbsp;DOB: ' + patient.DOB.toString(GC.chartSettings.dateFormat);

            html[j++] = ' ) </label>';
            list.append(html.join(""));
        });

        list.find("input").click(function(e) {

            root.find(".continue-button").removeClass("ui-state-disabled");
            this.checked = true;
            e.stopPropagation();
            return true;
        });

        list.find("label").click(function() {
            $(this).find("input").triggerHandler("click");
        });
        
        root.find(".continue-button").click(function()
        {
            if ( !$(this).is(".ui-state-disabled") ) {
                var idx = parseFloat(list.find("input:checked").val());

                hasSelection = true;

                if(idx == 0  && current_patientID != Clark_id)
                {
                     window.sessionStorage.setItem('patientid_global',Clark_id );
                     alert(' A new patient, Clark Kent, FHIR ID = ' + Clark_id + ' , has been selected. Please wait a moment while new data is retrieved from the server'  );
                     document.location = '?mode=' + $(this).attr('user-role');
                }
                else
                if(idx == 1  && current_patientID != Kara_id)
                {
                      window.sessionStorage.setItem('patientid_global',Kara_id );
                     alert(' A new patient, Kara Kent, FHIR ID =  ' + Kara_id + ' ,  has been selected. Please wait a moment while new data is retrieved from the server'  );
                     document.location = '?mode=' + $(this).attr('user-role');
                }
                else
                {

                     root.find(".continue-button").addClass("ui-state-disabled");
                     hasSelection = false;
                 }   

                //for offline mode enable
                //GC.samplePatient = GC.availableSamplePatients[idx];
            }
        });

    }

    NS.PatientsView = {
        render : function() {

            renderPatientsView("#view-patients");
        }
    };

    $(function() {
        if (!PRINT_MODE) {

            $("html").bind("set:viewType set:language", function(e) {
                if (isPatientsViewVisible()) {
                    renderPatientsView("#view-patients");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) {
                if (isPatientsViewVisible()) {
                    renderPatientsView("#view-patients");
                }
            });

            GC.Preferences.bind("set", function(e) {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") {
                    if (isPatientsViewVisible()) {
                        renderPatientsView("#view-patients");
                    }
                }
            });

            GC.Preferences.bind("set:timeFormat", function(e) {
                renderPatientsView("#view-patients");
            });
        }
    });
}(GC, jQuery));