FHIR PDF
==========================

Description
-----------
Creates a PDF given a FHIR resource.

Pre-requisites
------------
- nodejs 

Installation
------------
1. Install dependencies
> npm install

2. Run the server
> node server.js

This will start the server on port 9000 by default

You may provide variables through the .env file
> node  --env-file=.env server.js

Usage
------------
> curl -X POST --data "@./tests/resources/prescription.json" http://localhost:9000/prescription --output prescription.pdf


.env file
------------

| property   | description   | example value   |
| ------------ | ------------ | ------------ |
| PORT  | server port to listen to  | 3000   |
| CACHE_TEMPLATE  | if template content should be cached   | true  |
