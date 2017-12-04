jQuery.fn.serializeObject = function () {
  var formData = {};
  var formArray = this.serializeArray();

  for(var i = 0, n = formArray.length; i < n; ++i)
    formData[formArray[i].name] = formArray[i].value;

  return formData;
};

function getPatientName (pt) {
    if (pt.name) {
        var names = pt.name.map(function(name) {
            console.log(name);
            //return name.given.join(" ") + " " + name.family.join(" ");
            return name.given.join(" ") + " " + name.family;
        });
        return names.join(" / ")
    } else {
        return "anonymous";
    }
}

function getPatientId (pt) {
    return pt.id;
}

function getPatientGender (pt) {
    if (pt.gender) {
        return pt.gender;
    } else {
        return "unknown";
    }
}
function getPatientImage (pt) {
    var genderImage;
    if (pt.gender) {
        if(pt.gender == "female"){
            genderImage = "<img class='genderImage' src='img/female.png' height='40' width='20'>"
        }
        else{
            genderImage = "<img class='genderImage' src='img/male.png' height='40' width='20'>"
        }
    }
    else{
        genderImage = "<img src='img/question.jpg' height='40' width='40'>"
    }
    return genderImage;
}

function addressMap(addr) {
    var address = addr.line + " / " + addr.city + " / " + addr.state;
    console.log(address);
    return address;
}

function getPatientAddress (pt) {
    if (pt.address) {
        console.log(pt.address);
        var names = pt.address.map(addressMap);
        return names.join(" / ")
    } else {
        return "unknown";
    }
}



// function getMedicationName (medCodings) {
//     var coding = medCodings.find(function(c){
//         return c.system == "http://www.nlm.nih.gov/research/umls/rxnorm";
//     });
//
//     return coding && coding.display || "Unnamed Medication(TM)"
// }

function getQuestionnaireItem (item) {

    console.log(item.linkId + " :: " + item.text);

    var dispItem = ("<br/>" + item.linkId + ".   " + item.text + "<br/>" ) || "Unknown Question";

    // dispItem+= '<select class="form-control" id="linkId-'+item.linkId +'" name="linkId-'+item.linkId+'">';
    // for (var i = 0; i < item.option.length; i++) {
    //     dispItem += '<option value="' + item.option[i].code +'">' + item.option[i].display + '</option>';
    // }
    // dispItem+= '</select>';

    dispItem+= '<div class="btn-group" data-toggle="buttons">';
    for (var i = 0; i < item.option.length; i++) {
        dispItem += '<label class="btn btn-primary">';
        dispItem += '  <input type="radio" name="linkId-' + item.linkId + '" value="' + item.option[i].code + '" required > ' + item.option[i].display;
        dispItem +='</label>';
    }
    dispItem+= '</div><p/>';


    console.log(dispItem);

    return dispItem;
}

function getQuestionnaireId(qnr) {
    return qnr.id;
}

function displayPatient (pt) {
    //document.getElementById('patient_image').innerHTML = getPatientImage(pt);
    document.getElementById('patient_name').innerHTML = getPatientName(pt);
    document.getElementById('patient_id').value = getPatientId(pt);
    document.getElementById('patient_gender').innerHTML = getPatientGender(pt);
    document.getElementById('patient_address').innerHTML = getPatientAddress(pt);
}

function resetPatient() {
    //document.getElementById('patient_image').innerHTML = getPatientImage(pt);
    document.getElementById('patient_name').innerHTML = "";
    document.getElementById('patient_id').value = "";
    document.getElementById('patient_gender').innerHTML = "";
    document.getElementById('patient_address').innerHTML = "";
}

function resetQuestionnaire() {
    //document.getElementById('patient_image').innerHTML = getPatientImage(pt);
    document.getElementById('qn_list').innerHTML = "";
    document.getElementById('qnr_id').value = "";
    document.getElementById('qn_ct').value = "";

}

// var med_list = document.getElementById('med_list');
//
// function displayMedication (medCodings) {
//     med_list.innerHTML += "<li> " + getMedicationName(medCodings) + "</li>";
// }

var qn_list = document.getElementById('qn_list');

function displayQuestionnaire (item) {
    qn_list.innerHTML += "<li> " + getQuestionnaireItem(item) + "</li>";
}

var qnr_id = document.getElementById('qnr_id');

var qn_ct = document.getElementById('qn_ct');

function displayQuestionnaireId(qnr) {
    qnr_id.value = getQuestionnaireId(qnr);
    qn_ct.value = qnr.group.question.length;
}

// Create a FHIR client (server URL, patient id in `demo`)
var smart = FHIR.client(demo);
    pt = smart.patient;

function getSmartClient(demo,ptId) {
    demo.patientId = ptId;
    return FHIR.client(demo);
}

// Create a patient banner by fetching + rendering demographics
function getPatientInfo(smart) {
    pt = smart.patient;

    smart.patient.read().then(function (pt) {
        displayPatient(pt);
    });
}

function onChangePatient(elementId) {
    var ptId = elementId.value;
    var smart = getSmartClient(demo,ptId);
    
    resetPatient();
    resetQuestionnaire();

    getPatientInfo(smart);
    getObesityQuestionnaire(smart);
}

// A more advanced query: search for active Prescriptions, including med details
smart.patient.api.fetchAllWithReferences({type: "MedicationOrder"},["MedicationReference.medicationReference"]).then(function(results, refs) {
    results.forEach(function(prescription){
        if (prescription.medicationCodeableConcept) {
            displayMedication(prescription.medicationCodeableConcept.coding);
        } else if (prescription.medicationReference) {
            var med = refs(prescription, prescription.medicationReference);
            displayMedication(med && med.code.coding || []);
        }
    });
});

smart.patient.api.fetchAllWithReferences({type: "QuestionnaireResponse", query: {subject: demo.patientId, questionnaire: "2019282"}}).then(function(results, refs) {
//smart.patient.api.fetchAllWithReferences({type: "QuestionnaireResponse", query: {subject: demo.patientId, questionnaire.title: "Healthy Habits Questionnaire"}}).then(function(results, refs) {
    /*results.forEach(function(prescription){
        if (prescription.medicationCodeableConcept) {
            displayMedication(prescription.medicationCodeableConcept.coding);
        } else if (prescription.medicationReference) {
            var med = refs(prescription, prescription.medicationReference);
            displayMedication(med && med.code.coding || []);
        } */

        console.log(results);
        console.log(refs);
    //});

});

function getObesityQuestionnaire(smart) {
    smart.api.fetchAll({
        type: "Questionnaire",
        query: {title: "Obesity Healthy Habits Questionnaire"}
    }).then(function (results, refs) {
        results.forEach(function (questionnaire) {
            displayQuestionnaireId(questionnaire);
            for (var i = 0; i < questionnaire.group.question.length; i++) {
                displayQuestionnaire(questionnaire.group.question[i]);
                console.log(questionnaire.group.question[i]);
            }
        });
        console.log(results);
    });
}



var qnr_rsp = {   resourceType:"QuestionnaireResponse",
                meta: {
                    versionId:"1",
                    lastUpdated:new Date()
                    },
                questionnaire:{
                    reference:"Questionnaire/Unknown"
                    },
                status:"completed",
                subject:{
                        reference:"Patient/Unknown" 
                    },
                author:{
                        reference:"Patient/Unknown"
                    },
                authored:new Date(),
                group: {
                    linkId:"root",
                    question: []
                }
            };




function subOnClick() {
    var qnrsp_form_sub = $('#qn_form').serializeObject();

    // var qnrsp_form_sub = {};
    // var formArray = this.serializeArray();

    // for(var i = 0, n = formArray.length; i < n; ++i) {
    //     qnrsp_form_sub[formArray[i].name] = formArray[i].value;
    // }

    console.log(qnrsp_form_sub);

    //var qnrsp_id = new Date().getUTCMilliseconds();
    var qnrsp_patient_id = "Patient/" + qnrsp_form_sub['patient_id'];
    var qnr_id = "Questionnaire/" + qnrsp_form_sub['qnr_id'];

    var qns_sub = [];
    var j = 0;

    for (i = 0, n= qnrsp_form_sub['qn_ct']; i < n; i++) {

        j = i + 1;

        var qn = { 
            linkId: "x", 
            answer: []
         };

        qn.linkId = j.toString();
        qn.answer[0] = { valueInteger: qnrsp_form_sub['linkId-' + j] };
        qns_sub[i] = qn;

    }

    qnr_rsp.group.question = qns_sub;
    qnr_rsp.questionnaire.reference = qnr_id;
    qnr_rsp.subject.reference = qnrsp_patient_id;
    qnr_rsp.author.reference = qnrsp_patient_id;

    var entry = { category: [{label: "GT-HW-Fall2017-App"}], resource: qnr_rsp};

    console.log(JSON.stringify(entry));

    // smart.create(entry, 
    //     function(results){
    //         console.log(results);
    //     },
    //     function(error){
    //         console.log(error);
    //     }
    // );

    // smart.patient.create(entry).then(function(results, error) {

    //     console.log(results);
    //     console.log(error);

    //     }
    // );


    var url = window.location.protocol+"//"+window.location.host+"/response";
    var method = "POST";
    var postData = JSON.stringify(qnr_rsp);

    var shouldBeAsync = true;

    var request = new XMLHttpRequest();

    request.onload = function () {

       var status = request.status; // HTTP response status, e.g., 200 for "200 OK"
       var data = request.responseText; // Returned data, e.g., an HTML document.
       console.log(data);
    }

    request.onreadystatechange = function() {
        if (request.readyState == XMLHttpRequest.DONE) {
           //document.getElementById("demo").innerHTML = this.responseText;
           console.log(request.responseText);
           alert(request.responseText);
       }
    };

    request.open(method, url, shouldBeAsync);

    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    request.send(postData);


    return false;

}


