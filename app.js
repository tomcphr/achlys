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
app.get("/register", function (req, res) {
    res.sendFile(__dirname + "/client/register.html");
});

var port = 8080;
host.listen(port);
console.log("Listening on Port '" + port + "'");

var users = new PouchDB("users");
var messages = new PouchDB("messages");

var sockets = {};
var players = {};

var Player = function (id) {
    var object = {
        "id"        :   id,
        "hp"        :   100,
        "gender"    :   "M",
        "x"         :   Math.random() * (240 - 0) + 0,
        "y"         :   Math.random() * (160 - 0) + 0,
        "message"   :   "",
        "keys"      :   {
            "left"      :   false,
            "right"     :   false,
            "up"        :   false,
            "down"      :   false,
        },
        "facing"    :   "down",
        "walking"   :   false,
        "frame"     :   1,
        "speed"     :   9,
    };

    users.get(id).then(function (doc) {
        for (var key in doc.details) {
            object[key] = doc.details[key];
        }
    }).catch(function () {});
    
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
                object.frame += 0.25;
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
        var username = form.username.toLowerCase();
        
        var player = new Player(username);

        // Ensure that the user isn't already logged in
        if (players.hasOwnProperty(username)) {
            fn(false);
            return;
        } else {
            users.get(username).then(function (doc) {
                if (bcrypt.compareSync(form.password, doc.password)) {
                    fn(true);
                    return;
                }
                fn(false);
            }).catch(function () {
                fn(false);
            });
        }
    });
    
    socket.on("create", function (form, fn) {
        if (!form.email) {
            fn(false, "Email address cannot be blank");
            return;
        }
        
        var username = form.username.toLowerCase();
        if (!username) {
            fn(false, "Username cannot be blank");
            return;
        }
        
        if (!form.password) {
            fn(false, "Password cannot be blank");
            return;
        }
        
        if (!form.gender) {
            fn(false, "A gender must be selected");
            return;
        }
        
        createUser(form.email, username, form.password, form.gender, fn);
    });

    socket.on("runGame", function (name) {
        var player = new Player(name);
        players[name] = player;

        socket.on("disconnect", function () {
            var player = players[name];

            users.get(name).then(function (doc) {
                doc.details.gender = player.gender;
                doc.details.x = player.x;
                doc.details.y = player.y;
                doc.details.facing = player.facing;
                return users.put(doc);
            });

            delete sockets[session];
            delete players[name];
        });
        
        socket.on("nofocus", function (data) {
            player.resetFacing();
            player.walking = false;
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

        var timeout = null;
        socket.on("message", function (data) {
            if (timeout) {
                clearTimeout(timeout);
            }

            player.message = data;
        
            timeout = setTimeout(function() {
                player.message = "";
            }, 4000);
        })
    });
});

function createUser(email, username, password, gender, fn) 
{
    users.get(username).then(function (doc) {
        fn(false, "Username already exists");
    }).catch(function () {
        var hash = bcrypt.hashSync(password, 10);
        users.put({
            _id: username,
            password: hash,
            email: email,
            details: {
                gender: gender,
                x: Math.random() * (240 - 0) + 0,
                y: Math.random() * (160 - 0) + 0,
                facing: "down",
            }
        });
        fn(true);
    });
}

setInterval(function () {
    var details = [];
    for (var i in players) {
        var player = players[i];
        player.updatePosition();
        player.updateFrame();
        details.push({
            "id"        :   player.id,
            "hp"        :   player.hp,
            "gender"    :   player.gender,
            "facing"    :   player.facing,
            "frame"     :   Math.ceil(player.frame),
            "x"         :   player.x,
            "y"         :   player.y,
            "message"   :   player.message,
        });
    }

    for (var i in sockets) {
        var socket = sockets[i];

        socket.emit("details", details);
    }
}, 1000 / 30);
