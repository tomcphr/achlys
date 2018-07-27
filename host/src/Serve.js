class Serve {
    constructor () {
        this.express = require("express");

        this.server = this.createServer();

        this.http = require("http").Server(this.server);

        this.io = require("socket.io")(this.http, {});
    };

    createServer () {
        const path = require("path");

        var above = path.resolve(__dirname, '..', '..');

        var server = this.express();

        server.get("/", function (request, response) {
            var location = above + "/client/index.html";

            response.sendFile(location);
        });

        server.use("/js", this.express.static(above + "/client/js"));
        server.use("/img", this.express.static(above + "/client/img"));
        server.use("/css", this.express.static(above + "/client/css"));

        return server;
    };

    getHttp () {
        return this.http;
    };

    listen (port) {
        if (!port) {
            port = 8080;
        }

        this.http.listen(port);

        console.log("Listening on Port '" + port + "'");
    };

    getIo () {
        return this.io;
    };
}

module.exports = Serve;
