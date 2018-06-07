var express = require("express");
var app = express();
var host = require("http").Server(app);
var mysql = require("node-mysql-helper");
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

mysql.connect({
    host: "mysql.cf0ltiuy5g4n.eu-west-1.rds.amazonaws.com",
    user: "root",
    password: "r7ttdqAU1JrS714UOr0u",
    database: "deko"
});

var port = 8080;
host.listen(port);
console.log("Listening on Port '" + port + "'");

var sockets = {};
var players = {};

var Player = function (id) {
    var object = {
        "id"        :   id,
        "hp"        :   100,
        "avatar"    :   "M",
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

    mysql.record("users", {"username": id}).then(function (record) {
        if (record) {
            object.avatar = record.avatar;
            object.hp = record.health;
        }
    });

    mysql.record("positions", {"username": id}).then(function (record) {
        if (record) {
            object.x = record.x;
            object.y = record.y;
            object.facing = record.facing;
        }
    });

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
            mysql.record("users", {"username": username}).then(function (record) {
                if (bcrypt.compareSync(form.password, record.password)) {
                    fn(true);
                    return;
                }
                fn(false);
            }).catch (function () {
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

        if (!form.avatar) {
            fn(false, "A avatar must be selected");
            return;
        }

        createUser(form.email, username, form.password, form.avatar, fn);
    });

    socket.on("login", function (name) {
        var player = new Player(name);
        players[name] = player;

        socket.on("logout", function () {
            logoutUser(name);
        });

        socket.on("disconnect", function () {
            logoutUser(name);

            delete sockets[session];
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

            mysql.insert("messagelog", {
                "username"  :   name,
                "message"   :   data,
                "date"      :   Math.floor(Date.now() / 1000)
            });

            player.message = data;

            timeout = setTimeout(function() {
                player.message = "";
            }, 4000);
        })
    });
});

function createUser(email, username, password, avatar, fn)
{
    mysql.record("users", {"username": username}).then(function (record) {
        if (!record) {
            var hash = bcrypt.hashSync(password, 10);
            mysql.insert("users", {
                "username"  :   username,
                "password"  :   hash,
                "email"     :   email,
                "avatar"    :   avatar,
                "health"    :   100
            }).then(function(info){
                mysql.insert("positions", {
                    "username"  :   username,
                    "x"         :   Math.random() * (240 - 0) + 0,
                    "y"         :   Math.random() * (160 - 0) + 0,
                    "facing"    :   "down"
                }).catch(function (error) {
                    mysql.delete("users", {"username": username});

                    fn(false, error.message);
                })

                fn(true);
            }).catch(function (error) {
                fn(false, error.message);
            });

            return;
        }

        fn(false, "Username already exists");
    }).catch(function (error) {
        fn(false, "Something went wrong: " + error.message);
    });
}

function logoutUser(username)
{
    var player = players[username];

    mysql.update("users", {"username": username}, {
        "health"    :   player.hp
    });

    mysql.update("positions", {"username": username}, {
        "x"         :   player.x,
        "y"         :   player.y,
        "facing"    :   player.facing
    });

    delete players[username];
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
            "avatar"    :   player.avatar,
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
