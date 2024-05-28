const http = require("http");
const { routes } = require("./src/routes");

const SERVER_PORT = process.env.PORT || 9000;
const server = http.createServer((request, response) => {
    routes(request, response);
});

server.listen(SERVER_PORT, () => {
    console.log("Server is running on Port " + SERVER_PORT);
});
