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

        server.get("/js/sockets.js", function (request, response) {
            var location = above + "/client/node_modules/socket.io-client/dist/socket.io.slim.js";

            response.sendFile(location);
        })

        server.get("/js/phaser.js", function (request, response) {
            var location = above + "/client/node_modules/phaser/dist/phaser.js";

            response.sendFile(location);
        });

        server.use("/dist", this.express.static(above + "/client/dist"));
        server.use("/gui", this.express.static(above + "/client/assets/gui"));
        server.use("/tilesets", this.express.static(above + "/client/assets/tilesets"));
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
