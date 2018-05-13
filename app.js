var express = require("express");
var app = express();
var host = require("http").Server(app);

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/client/index.html");
});
app.use("/client", express.static(__dirname + "/client"));

var port = 80;
host.listen(port);
console.log("Listening on Port '" + port + "'");

var sockets = {};
var players = {};

var Player = function (id) {
    var object = {
        "x"     :   250,
        "y"     :   250,
        "keys"  :   {
            "left"  :   false,
            "right" :   false,
            "up"    :   false,
            "down"  :   false,
        },
        "speed" :   10,
    };

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

    return object;
}

var io = require("socket.io")(host, {});
io.sockets.on("connection", function (socket) {
    var session = Math.random();
    socket.id = session;

    sockets[session] = socket;

    var user = Math.random();
    var player = new Player(user);
    players[user] = player;

    console.log("New socket connection:" + session);

    socket.on("disconnect", function () {
        console.log("Socket connection disconnected: " + session);
        delete sockets[session];
        delete players[user];
    });

    socket.on("keyPress", function (data) {
        player.keys[data.type] = data.state;
    });
});

setInterval(function () {
    var positions = [];
    for (var i in players) {
        var player = players[i];
        player.updatePosition();
        positions.push({
            "x" :   player.x,
            "y" :   player.y,
        });
    }

    for (var i in sockets) {
        var socket = sockets[i];

        socket.emit("positions", positions);
    }
}, 1000 / 25);
