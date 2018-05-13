var express = require("express");
var app = express();
var host = require("http").Server(app);

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/client/index.html");
});
app.use("/client", express.static(__dirname + "/client"));
app.use("/js", express.static(__dirname + "/client/js"));
app.use("/img", express.static(__dirname + "/client/img"));
app.use("/css", express.static(__dirname + "/client/css"));

var port = 80;
host.listen(port);
console.log("Listening on Port '" + port + "'");

var PouchDB = require("pouchdb");
var db = new PouchDB("database");

var sockets = {};
var players = {};

var Player = function (id) {
    var object = {
        "id"        :   id,
        "x"         :   Math.random() * (240 - 0) + 0,
        "y"         :   Math.random() * (160 - 0) + 0,
        "keys"      :   {
            "left"      :   false,
            "right"     :   false,
            "up"        :   false,
            "down"      :   false,
        },
        "facing"    :   "down",
        "walking"   :   false,
        "frame"     :   1,
        "speed"     :   15,
    };

    object.resetFacing = function () {
        for (var property in object.keys) {
            if (object.keys.hasOwnProperty(property)) {
                object.keys[property] = false;
            }
        }
    }

    object.updatePosition = function () {
        if (object.keys.right) {
            object.x += object.speed;
        } else if (object.keys.left) {
            object.x -= object.speed;
        } else if (object.keys.up) {
            object.y -= object.speed;
        } else if (object.keys.down) {
            object.y += object.speed;
        }
    }

    object.updateFrame = function () {
        if (object.walking) {
            if (object.frame < 2) {
                object.frame++;
            } else {
                object.frame = 0;
            }
        } else {
            object.frame = 1;
        }
    }

    return object;
}

var io = require("socket.io")(host, {});
io.sockets.on("connection", function (socket) {
    var session = Math.random();
    socket.id = session;

    sockets[session] = socket;

    socket.on("adduser", function (name) {
        if (players.hasOwnProperty(name)) {
            console.log("Username already in use");
            return;
        }

        var player = new Player(name);
        players[name] = player;

        var detail = "[session: " + session + ", user: " + name + ", x: " + player.x + ", y: " + player.y + "]";

        console.log("Login - " + detail);

        socket.on("disconnect", function () {
            var player = players[name];
            var detail = "[session: " + session + ", user: " + name + ", x: " + player.x + ", y: " + player.y + "]";
            console.log("Logout - " + detail);
            delete sockets[session];
            delete players[name];
        });

        socket.on("keyPress", function (data) {
            var type = data.type;
            if (!type) {
                return;
            }

            player.resetFacing();

            player.keys[type] = data.state;

            if (data.state) {
                player.facing = type;
                player.walking = true;
            } else {
                player.walking = false;
            }
        });
    });
});


setInterval(function () {
    var positions = [];
    for (var i in players) {
        var player = players[i];
        player.updatePosition();
        player.updateFrame();
        positions.push({
            "id"        :   player.id,
            "facing"    :   player.facing,
            "frame"     :   player.frame,
            "x"         :   player.x,
            "y"         :   player.y,
        });
    }

    for (var i in sockets) {
        var socket = sockets[i];

        socket.emit("positions", positions);
    }
}, 1000 / 17);
