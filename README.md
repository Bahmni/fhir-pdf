FHIR PDF
==========================

Description
-----------
Creates a PDF given a FHIR resource.

Pre-requisites
------------
- nodejs 

Developed with node version - v22.2.0.  
If you are developing with multiple nodejs versions, use [NVM](https://github.com/nvm-sh/nvm)

Installation
------------
1. Install dependencies
> npm install

2. Run the server
> node server.js

This will start the server on port 9000 by default

You may provide variables through the .env file
> node  --env-file=.env server.js

Development
------------
The service first uses [EJS](https://ejs.co/#features) templates to bind a HTML template with the data, and then uses [Puppeteer](https://pptr.dev/) to convert the generated HTML to PDF. 
[FhirPath](https://www.hl7.org/fhirpath/) is used as expression insides the ejs templates. See [fhirpath.js](https://github.com/HL7/fhirpath.js) for help on how to evaluate expressions.  

Usage
------------
> curl -X POST --data "@./tests/resources/prescription.json" http://localhost:9000/prescription --output prescription.pdf


.env file
------------

| property   | description   | example value   |
| ------------ | ------------ | ------------ |
| PORT  | server port to listen to  | 3000   |
| CACHE_TEMPLATE  | if template content should be cached   | true  |
