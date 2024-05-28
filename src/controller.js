const puppeteer = require('puppeteer');
const fhirPath = require('fhirpath');
const fhirpath_r4_model = require('fhirpath/fhir-context/r4');
const fs = require('fs'),
    ejs = require("ejs");
const path = require('path');  
const correlator = require("correlation-id");  
const cacheTemplate= process.env.CACHE_TEMPLATE ? JSON.parse(process.env.CACHE_TEMPLATE) : false;
const templateBaseUrl = process.env.TMPL_BASE_URL;

function printLog(msg) {
    console.log("%s: %s", correlator.getId(), msg);
}

var fhirPatient = {
    "resourceType": "Patient",
    "id": "example",
    "address": [
      {
        "use": "home",
        "city": "PleasantVille",
        "type": "both",
        "state": "Vic",
        "line": [
          "534 Erewhon St"
        ],
        "postalCode": "3999",
        "period": {
          "start": "1974-12-25"
        },
        "district": "Rainbow",
        "text": "534 Erewhon St PeasantVille, Rainbow, Vic  3999"
      }
    ],
    "managingOrganization": {
      "reference": "Organization/1"
    },
    "name": [
      {
        "use": "official",
        "given": [
          "Peter",
          "James"
        ],
        "family": "Chalmers"
      },
      {
        "use": "usual",
        "given": [
          "Jim"
        ]
      },
      {
        "use": "maiden",
        "given": [
          "Peter",
          "James"
        ],
        "family": "Windsor",
        "period": {
          "end": "2002"
        }
      }
    ],
    "birthDate": "1974-12-25",
    "deceased": {
      "boolean": false
    },
    "active": true,
    "identifier": [
      {
        "use": "usual",
        "type": {
          "coding": [
            {
              "code": "MR",
              "system": "http://hl7.org/fhir/v2/0203"
            }
          ]
        },
        "value": "12345",
        "period": {
          "start": "2001-05-06"
        },
        "system": "urn:oid:1.2.36.146.595.217.0.1",
        "assigner": {
          "display": "Acme Healthcare"
        }
      }
    ],
    "telecom": [
      {
        "use": "home"
      },
      {
        "use": "work",
        "rank": 1,
        "value": "(03) 5555 6473",
        "system": "phone"
      },
      {
        "use": "mobile",
        "rank": 2,
        "value": "(03) 3410 5613",
        "system": "phone"
      },
      {
        "use": "old",
        "value": "(03) 5555 8834",
        "period": {
          "end": "2014"
        },
        "system": "phone"
      }
    ],
    "gender": "male",
    "contact": [
      {
        "name": {
          "given": [
            "Bénédicte"
          ],
          "family": "du Marché",
          "_family": {
            "extension": [
              {
                "url": "http://hl7.org/fhir/StructureDefinition/humanname-own-prefix",
                "valueString": "VV"
              }
            ]
          }
        },
        "gender": "female",
        "period": {
          "start": "2012"
        },
        "address": {
          "use": "home",
          "city": "PleasantVille",
          "line": [
            "534 Erewhon St"
          ],
          "type": "both",
          "state": "Vic",
          "period": {
            "start": "1974-12-25"
          },
          "district": "Rainbow",
          "postalCode": "3999"
        },
        "telecom": [
          {
            "value": "+33 (237) 998327",
            "system": "phone"
          }
        ],
        "relationship": [
          {
            "coding": [
              {
                "code": "N",
                "system": "http://hl7.org/fhir/v2/0131"
              }
            ]
          }
        ]
      }
    ]
}

function generateHtml(template, data) {
    return new Promise((resolve, reject) => {
        try {
            printLog("generating html .... ");
            let tmplFn = ejs.compile(template);
            let html = tmplFn(data);
            //printLog(html);
            resolve(html);
        } catch (err) {
            printLog(err);
            reject('Could not generate html');
        }
    });
}


var templateCache = [];

function fetchTemplate(path) {
    return new Promise((resolve, reject) => {
        printLog("fetching template .... ");
        if (cacheTemplate === true) {
          const cachedContent = templateCache.find( e => e.path === path);
          if (cachedContent) {
              printLog("Returning cached template .... ");
              resolve(cachedContent.content);
              return;
          }
        }
        const fetchFromServer = templateBaseUrl === undefined || templateBaseUrl.trim() === '';
        
        fs.readFile(path, 'utf8', (err, content) => {
            if (err) { 
                printLog(err); 
                reject('Could not read template file'); 
            } else {
                if (cacheTemplate === true) {
                  templateCache.push({
                      "path": path,
                      "content": content
                  });
                }
                resolve(content);
            }
        });
    });
}

function generatePdf(path, html) {
    printLog('launching browser .... ');
    return puppeteer.launch()
            .then((browser) => {
                return browser.newPage()
                    .then((page) => {
                        printLog('Generating pdf with page .... ');
                        return page.setContent(html, { waitUntil: 'networkidle0' })
                            .then(() => page.emulateMediaType('screen'))
                            .then(() => page.pdf({
                                    path: path + ".pdf",
                                    margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
                                    printBackground: true,
                                    format: 'A4',
                                }));
                    }).finally(() => {
                        printLog('closing browser ... ');
                        return browser.close();
                    });
            });
}

function createPdf(path, data) {
    return fetchTemplate(path)
        .then((content) => generateHtml(content, data))
        .then((html) => generatePdf(path, html));
}

const opConsultationRecordHandler = (request, response, example) => {
    requestHandler(request, response, example, './../public/op-consult.template');
}

const prescriptionRecordHandler = (request, response, example) => {
  requestHandler(request, response, example, './../public/prescription.template');
}

const requestHandler = (request, response, example, templatePath) => {
    let chunks = [];
    // 'data' event is emitted on every chunk received
    request.on("data", (chunk) => {
        // collecting the chunks in array
        chunks.push(chunk);
    });
    // when all chunks are received, 'end' event is emitted.
    request.on("end", () => {
        correlator.withId(() => {
            let fhirData = fhirPatient;
            if (!example) {
                const buff = Buffer.concat(chunks);
                const jsonString = buff.toString();
                try {
                    fhirData = JSON.parse(jsonString);
                } catch(err) {
                    response.writeHead(400, {
                        "Content-Type": "application/json",
                    });
                    printLog(err);
                    response.write(JSON.stringify({message: err.toString()}));
                    response.end();
                    return;
                }
            }
            createPdf(path.resolve(__dirname, templatePath), 
                { 
                    fhirPath: fhirPath, 
                    tmplData: fhirData, 
                    fhirModel:fhirpath_r4_model,
                    patient: fhirPath.evaluate(fhirData, 'Bundle.entry.select(resource as Patient)', null, fhirpath_r4_model),
                    evaluatePath: function(expression, mData) {
                        return fhirPath.evaluate(mData || fhirData, expression, null, fhirpath_r4_model);
                    },
                    strToLocalDate: function(value) {
                      return value ? new Date(value).toLocaleDateString() : "";
                    },
                    strToLocalDateTime: function(value) {
                      return value ? new Date(value).toLocaleString() : "";
                    },
                    getAge: function(dateString) {
                      var today = new Date();
                      var birthDate = new Date(dateString);
                      var age = today.getFullYear() - birthDate.getFullYear();
                      var m = today.getMonth() - birthDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      return age;
                    }
                }   
            ).then(data => {
                printLog('sending application/pdf');
                response.writeHead(200, {
                    "Content-Type": "application/pdf",
                });
                response.write(data);
                response.end();
            }).catch(err => {
                response.writeHead(500, {
                    "Content-Type": "application/json",
                });
                response.write(JSON.stringify({message: err,}));
                response.end();
            });
        });
    });
};
  
const defaultHandler = (request, response) => {
    response.writeHead(404, {
        "Content-Type": "application/json",
    });
    response.write(
        JSON.stringify({
        message: `API not found at ${request.url}`,
        })
    );
    response.end();
};
  
module.exports = {
    opConsultationRecordHandler,
    prescriptionRecordHandler,
    defaultHandler,
};