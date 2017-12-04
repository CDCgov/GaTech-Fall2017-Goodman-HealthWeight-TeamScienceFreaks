# Health-Weight-on-FHIR Manual for Users and Developers - CS6440 Fall 2017 #  
**Project Name:** Health Weight on FHIR  
**Team Name:** Team ScienceFreaks  
**Team Members:** Lance Hundt, Michael Roth, Hassan Borteh, Joseph George, Jim Vaughan, Brodrick Stigall  
**Github Link:** https://github.gatech.edu/gt-hit-fall2017/Health-Weight-on-FHIR   

## Introduction ##

Our team worked on the Healthy Weight on FHIR app for the Fall 2017 semester of CS 6440 at Georgia Tech. The project demonstrates a proof of concept of a tool used by clinicians and patients to help aid the prevention of childhood obsity while integrating with the well-known healthcare standard FHIR. The project consists of 3 independent apps (patient-facing, provider-facing, and recommendation). The project also contains a local FHIR server with example patient data to demonstrate the use of the apps and help with development in the future.

We worked with two external mentors, Aly Goodman (CDC) and Mona Sharifi (Yale University). Their comments about the project in general include...

> ***These proof of concept applications at CDC show that these novel technologies can help support high quality clinical care and provides linkage to healthcare to community settings for more comprehensive and well-rounded childhood obesity prevention support and treatment. Projects like this show how tools and technologies can support population of doctors, providers, health care clinics, and communities with trying to provide high quality health care.*** 

When we analyzed the applications, each application was written in a different language and framework. Data was not available and needed to be loaded. To make it easier for future teams to develop and maintain, we decided to standardize all applications to use node js and JavaScript using a Responsive Web Design where possible. Patient facing app and Recommendations engine were completely rewritten using JavaScript and node js. To ensure data is loaded and always available, created a FHIR server with the data that was needed to showcase the application. The data was selected from Synthea or Exact and modified to suit our project requirements. Care was taken to include diverse data points by examining the Synthea, Exact and Michigan Health Information Network (MiHIN) and loading the selected data while transforming it where needed. The FHIR server was created as a Docker image - it runs on Tomcat with an embedded Derby database. Our project uses the Patient, Observation, Organization, Questionnaire and QuestionnaireResponse resources of FHIR extensively. 

## Setting up Development Environment ##

### Language/Tools ###
**Languages:**
* HTML
* CSS
* JavaScript

**Tools:**
* Node
* Bootstrap
* Docker
* Google Maps

### Developer Steps ###  

1. Clone the repo from https://github.gatech.edu/gt-hit-fall2017/Health-Weight-on-FHIR.git
2. Make sure docker is installed and running
3. In a command prompt, from the root of the repo, run “docker-compose up” (without the quotes)
4. Wait for a message similar to  org.apache.catalina.startup.Catalina.start Server startup in 25949 ms (the time portion will most likely be different)
* NOTE: If you execute “docker-compose up -d” you will need to wait 35 to 40 seconds for the FHIR server to fully start and checking the test emails will be more difficult since console messages will not appear.
5. There are three applications plus a FHIR server that are started
* The FHIR server will run on port 8080 and map locally to port 8080
* The provider will run on port 8081 and map locally to port 8081. To access the provider application navigate to http://localhost:8081
  * Once the page loads you should see charts for the selected patient.
  * NOTE: For best results the browser cache should be cleared between runs or Incognito mode should be used.
* To access the patient application navigate to http://localhost:8082
  * Scroll to the bottom and send an email for farmers markets or parks to an email address.
  * Check the console for a link to the sample email
  * NOTE: The recommendation app does NOT use a real SMTP (mail transport) server. It uses a test service provided by Ethereal. That is why you will need the link
* To access the recommendation application navigate to http://localhost:8083
  * You can send email/sms from the form for information on farmers markets or parks.
  *Try sending an email. Once the message has been sent the “Message” link will activate and allow viewing of the sample email.
  * NOTE: The recommendation application is coded against a test account with Twilio therefore only numbers that have been verified can receive sms messages.
  * NOTE: The recommendation application is coded against Ethereal for the email service. This is a test only service so the email will not actually be sent.


## Patient Facing App ##
The Patient facing app is used to collect responses of a basic healthy habit questionnaire that a patient or patient's family can fill out before their office visit. The questions and question responses are used into the FHIR database using it's standards. After the patient submits the their answers, the provider app is then able to retrieve these answers to show the provider in real time and help identify problematic habits thus reducing the amount of time a would clinician need to spend data collecting.

Our mentors updated the questions on the Questionnaire and corresponding sample QuestionnaireResponses were loaded into the database.

![alt text](https://github.gatech.edu/gt-hit-fall2017/Health-Weight-on-FHIR/blob/master/Manual/IMG/PatientFacing2.PNG "PatientFacingQuestionnaire")

### Navigating the App ###
1. Choose a patient from the drop down. In a real world scenario, this could be a search.
2. The patient data is loaded and the Obesity Health Habit Questionnaire is retrieved from the FHIR server and displayed to the patient. 
3. This questionnaire is tailored for Obesity screening and study. Since the design is responsive, it can be completed on a mobile device.
4. Select the appropriate answers to the questions and submit the response when finished.
5. The questionnaire response is saved in the FHIR server Docker container. The same response can be retrieved in the Provider facing app and displayed with color coded responses
6. Choose the appropriate recommendations to send a map of the resources available in the zip code of your choice.

## Provider Facing App ##  
The Provider Facing app is used by the clinician during a well care visit. It displays interactive growth charts, healthy habit history with questionnaire responses, healthy habit goals, referrals, and recommendations. The original app [link](https://github.com/smart-on-fhir/growth-chart-app "Growth Chart App") , was used by previous classes as the foundational app for the provider and additional tabs such as the healthy habit goals, referrals, and recommendations were added. 

### Navigating the App ###
1. Launch the app by going to http://localhost:8081  

### Growth Charts ###  
The Growth charts tab shows three charts, BMI, Length/Stature, and Weight. The app draws statistical percentile lines for each chart. The most important chart on this page is the BMI chart. The BMI chart shows BMI percentiles up to 95% and it also displays 110% to 200% of 95 percentile value of BMI. The BMI value between 85-95 percentile is considered overweight. And above 95 percentile is considered obese. The 110% to 200% line shows how obese a child is. The app pulss the patient’s age, height and weight from FHIR server and calculates his BMI and its percentile value and displays it on the chart’s percentile region. Moreover, it calculates the patient’s height and weight percentile and displays them on the height and weight charts. 

![alt text](https://github.gatech.edu/gt-hit-fall2017/Health-Weight-on-FHIR/blob/master/Manual/IMG/ColorCodingCharts.PNG "ColorCodingCharts")

### Healthy Habit History ###  
The Healthy Habit History tab shows the responses from the questionnaire the patient fills out in the patient facing app. There is a Progress tracker to track questionnaire responses for each question. At the bottom, a recent copy of the questionnaire response can be accessed by the provider. Also, responses are color coded to help bring attention to bad habits to the healthcare provider.
![alt text](https://github.gatech.edu/gt-hit-fall2017/Health-Weight-on-FHIR/blob/master/Manual/IMG/QuestionnaireResponse.PNG "QuestionnaireResponse")

### Healthy Habit Goals ###  
The Healthy Habit Goal tab is a way for the provider to set healthy habit goals with the patient. The questionnaire is also stored on the local FHIR server. The provider can Save and Print the goals which generates a nice printable page to hand over to the patient before they leave the office visit.  
![alt text](https://github.gatech.edu/gt-hit-fall2017/Health-Weight-on-FHIR/blob/master/Manual/IMG/HealthyHabitGoal.PNG "Healthy Habit Goals")

### Referrals/Recommendations ###

Under the referrals tab, the provider can refer patient to a specialist and also supply a recommended coding for the referral. 
Once the referrals are selected the provider can hit the "Send Refferal" button and referrals are sent to the local FHIR server.

![alt text](https://github.gatech.edu/gt-hit-fall2017/Health-Weight-on-FHIR/blob/master/Manual/IMG/referrals.PNG "Referrals")

A provider can also send recommendations for farmers markets or parks in the patient’s vicinity. The provider can send recommendations via SMS or email. See Recommendation Engine below for more details.

![alt text](https://github.gatech.edu/gt-hit-fall2017/Health-Weight-on-FHIR/blob/master/Manual/IMG/recommendations.PNG "Recommendations")

## Recommendations Engine ##  
The Recommendations Engine app is used communicate useful resources for the patient from the provider. If a patient is shown to be obese and has areas on the questionnaire that needs improvement such as eating better or getting more activity, the provider can call upon the recommendations engine to find Farmers Markets in the patient's local zip code. The recommendations engine can also look for nearby local city or county parks. The patient can either receive a Text message or email with the results. The Recommendations engine is called inside of the patient and provider facing apps.  

### Navigating the App ###
1. Choose Email or Text Message from drop down  
2. Select Farmers Markets or Parks  
3. Enter Zip Code  
4. Enter Email Address or Phone Number based on the selection from Step 1.

![alt text](https://github.gatech.edu/gt-hit-fall2017/Health-Weight-on-FHIR/blob/master/Manual/IMG/EmailRecommendation.PNG "EmailRecommendations")

