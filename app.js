var express = require("express");
var app = express();
var host = require("http").Server(app);
var PouchDB = require("pouchdb");
var bcrypt = require("bcrypt");

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/client/index.html");
});
app.use("/client", express.static(__dirname + "/client"));
app.use("/js", express.static(__dirname + "/client/js"));
app.use("/img", express.static(__dirname + "/client/img"));
app.use("/css", express.static(__dirname + "/client/css"));

app.get("/login", function (req, res) {
    res.sendFile(__dirname + "/client/login.html");
});

var port = 8080;
host.listen(port);
console.log("Listening on Port '" + port + "'");

var database = new PouchDB("database");

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
    database.get(id).then(function (doc) {
        for (var key in doc.details) {
            object[key] = doc.details[key];
        }
    }).catch(function (err) {});

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
    
    socket.on("validate", function (form, fn) {
        var player = new Player(form.username);

        // Ensure that the user isn't already logged in
        if (players.hasOwnProperty(form.username)) {
            fn(false);
            return;
        } else {
            database.get(form.username).then(function (doc) {
                if (bcrypt.compareSync(form.password, doc.password)) {
                    fn(true);
                    return;
                }
                fn(false);
            }).catch(function (err) {
                if (err.status == 404) {
                    var hash = bcrypt.hashSync(form.password, 10);
                    database.put({
                        _id: form.username,
                        password: hash,
                        details: {
                            x: player.x,
                            y: player.y,
                            facing: player.facing,
                        }
                    });
                    fn(true);
                    return;
                }
                fn(false);
            });
        }
    });

    socket.on("adduser", function (name) {
        var player = new Player(name);
        players[name] = player;

        socket.on("disconnect", function () {
            var player = players[name];

            database.get(name).then(function (doc) {
                doc.details.x = player.x;
                doc.details.y = player.y;
                doc.details.facing = player.facing;
                return database.put(doc);
            });

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
}, 1000 / 15);
