const { opConsultRecordHandler, defaultHandler } = require("./controller");

const routes = (request, response) => {
  const reqURL = request.url;
  const reqMethod = request.method;
  switch (reqMethod) {
    case "GET": {
      if (reqURL === "/op-consult-record") {
        opConsultRecordHandler(request, response);
      }
      break;
    }
    default: {
      defaultHandler(request, response);
    }
  }
};

module.exports = { routes };