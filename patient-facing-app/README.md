The preferred way to run this patient facing app is via docker-compose. From the root of this repository simply run `docker-compose up --build` if the applications have never been run. Otherwise run `docker-compose up`.

This will start all three applications plus a locally hosted FHIR server. The patient application will be available at http://localhost:8082.

If desired, the application can also be run via node. Please make sure you have installed [node](http://www.nodejs.org).

From the command prompt run `npm install` and then `npm start`. The patient applicaton will be available at http://localhost:8082.