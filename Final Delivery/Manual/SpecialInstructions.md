1. Clone the repo from https://github.com/CDCgov/GaTech-Fall2017-Goodman-HealthWeight-TeamScienceFreaks
2. Make sure docker is installed and running
3. In a command prompt, from the root of the repo, run “docker-compose up” (without the quotes)
4. Wait for a message similar to  org.apache.catalina.startup.Catalina.start Server startup in 25949 ms (the time portion will most likely be different)
    * NOTE: If you execute “docker-compose up -d” you will need to wait 35 to 40 seconds for the FHIR server to fully start and checking the test emails will be more difficult since console messages will not appear.
5. There are three applications plus a FHIR server that are started
    * The FHIR server will run on port 8080 and map locally to port 8080
    * To access the provider application navigate to http://localhost:8081
      * Once the page loads you should see charts for the selected patient.
      * NOTE: For best results the browser cache should be cleared between runs or Incognito mode should be used.
    * To access the patient application navigate to http://localhost:8082
      * Scroll to the bottom and send an email for farmers markets or parks to an email address.
      * Check the console for a link to the sample email
      * NOTE: The recommendation app does NOT use a real SMTP (mail transport) server. It uses a test service provided by Ethereal. That is why you will need the link
    * To access the recommendation application navigate to http://localhost:808
      * You can send email/sms from the form for information on farmers markets or parks.
      *Try sending an email. Once the message has been sent the “Message” link will activate and allow viewing of the sample email.
      * NOTE: The recommendation application is coded against a test account with Twilio therefore only numbers that have been verified can receive sms messages.
      * NOTE: The recommendation application is coded against Ethereal for the email service. This is a test only service so the email will not actually be sent.
