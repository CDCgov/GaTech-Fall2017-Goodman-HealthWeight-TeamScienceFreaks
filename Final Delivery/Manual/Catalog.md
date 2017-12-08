# Catalog #
**Project Name:** Health Weight on FHIR  
**Team Name:** Team ScienceFreaks  
**Team Members:** Lance Hundt, Michael Roth, Hassan Borteh, Joseph George, Jim Vaughan, Brodrick Stigall  
**Github Link:** https://github.com/CDCgov/GaTech-Fall2017-Goodman-HealthWeight-TeamScienceFreaks  

## Directory Structure ##  
**Health-Weight-on-FHIR (Directory)**  
|– patient-facing-app - (Directory)  
|– provider-facing-app - (Directory)  
|– recommendation-engine - (Directory)  
|– docker-compose.yml  
|– Dockerfile  
|– PatientDockerfile  
|– ProviderDockerfile  
|– README.md  
|– RecommendationDockerfile  
**|– Final Delivery – (Directory)**  
|–|– Research – (Directory)  
|–|– Manual – (Directory)   
|–|– Deliverable 1 presentation - Video Link.pdf  
|–|– Deliverable 1 presentation.pdf  
|–|– Final Project Presentation - Video Link.pdf   
|–|– catalog.pdf  
|–|– Special Instructions – ScienceFreaks.pdf  
|–|– Final Gant Chart – ScienceFreaks.pdf   
|–|– Manual – ScienceFreaks.pdf  
 

## Folder and File Descriptions ##
**Final Project Presentation – ScienceFreaks.pdf** - A PDF containing a link to our group’s final video presentation.

**catalog.pdf** - A “table of contents” type document cataloguing all of the elements of our project and their locations.

**Special Instructions – ScienceFreaks.pdf** - Instructions [“navigate to this URL… type in this… click on that…etc.”] for us (Instructors/OMs) to follow in order to run your application.

**Final Gantt Chart – ScienceFreaks.pdf** - Project Management Gantt chart

**Deliverable 1 presentation - Video Link.pdf** - Youtube Video link to Deliverable 1

**Deliverable 1 presentation.pdf** - Slides for Deliverable 1

**Final Project Presentation - Video Link.pdf** - Youtube Video link to Final Presentation

**Manual – ScienceFreaks.pdf** – Documentation for the apps 

**Research (Directory)** - Contains useful files our external mentors sent the team 

**patient-facing-app (Directory)** - Contains all the resources required to deploy and run the current version of the patient-facing-app. The app currently has 2 built in users who can be selected. These users can fill out questionnaires and submit them to be viewed by their physician. The users can also see recommendations that have been made for them by the system based on physician referrals. The patient app also provides access to the recommendation engine.

**provider-facing-app (Directory)** - Contains all the resources required to deploy and run the current version of the provider-facing-app. The app currently has two built in patients for which the provider can see growth charts, growth data, habit history and goals, questionnaire responses, and make referrals and recommendations. 

**recommendation-engine (Directory)** – Runs the recommendation engine as a service that the provider and patient apps use when generating useful recommendations
