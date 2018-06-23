var express = require("express");
var app = express();
var host = require("http").Server(app);
var mysql = require("node-mysql-helper");
var bcrypt = require("bcrypt");
var validator = require("email-validator");

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
var items = {};

var Player = function (id) {
    var object = {
        "id"        :   id,
        "moderator" :   0,
        "hp"        :   100,
        "avatar"    :   "M",
        "x"         :   Math.random() * (240 - 0) + 0,
        "y"         :   Math.random() * (160 - 0) + 0,
        "width"     :   24,
        "height"    :   32,
        "message"   :   {
            "id"        :   id + "_" + Math.round((new Date()).getTime() / 1000),
            "text"      :   "",
        },
        "timeout"   :   null,
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
            object.moderator = record.moderator;
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

    object.pickup = function (itemId, quantity)
    {
        var where = {
            "username"  :   object.id,
            "item"      :   itemId,
        };

        mysql.record("inventories", where).then(function (record) {
            if (!record) {
                mysql.insert("inventories", {
                    "username"  :   object.id,
                    "item"      :   itemId,
                    "quantity"  :   quantity,
                });

                return;
            }

            mysql.update("inventories", where, {
                "quantity"  :   quantity + record.quantity,
            });
        })
    }

    object.die = function () {
        getInventoryItems(object.id, function (type, inventory) {
            if (type && inventory) {
                for (var key in inventory) {
                    var item = inventory[key];

                    var key = "drop_" + object.id + "_" + item["id"] + "_" + Math.round((new Date()).getTime() / 1000);

                    items[key] = {
                        "id"        :   item["id"],
                        "name"      :   item["name"],
                        "quantity"  :   item["quantity"],
                        "x"         :   object.x,
                        "y"         :   object.y,
                        "width"     :   32,
                        "height"    :   32
                    };
                }

                mysql.delete("inventories", {"username": id});
            }
            object.x = Math.random() * (240 - 0) + 0;

            object.y = Math.random() * (160 - 0) + 0;

            object.hp = 100;
        });
    }

    object.resetFacing = function () {
        for (var property in object.keys) {
            if (object.keys.hasOwnProperty(property)) {
                object.keys[property] = false;
            }
        }
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
    };

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
    };

    return object;
};

var io = require("socket.io")(host, {});
io.sockets.on("connection", function (socket) {
    var session = Math.random();
    socket.id = session;
    socket.game = {};

    // Listen out for the user validation.
    socket.on("login", function (form, fn) {
        if (!form.username || !form.password) {
            fn(false, "Invalid user details provided");
            return;
        }

        var username = form.username.toLowerCase();

        // Ensure that the user isn't already logged in
        if (players.hasOwnProperty(username)) {
            fn(false, "User already logged in");
            return;
        } else {
            mysql.record("users", {"username": username}).then(function (record) {
                if (bcrypt.compareSync(form.password, record.password)) {
                    playGame(session, socket, username);
                    fn(true);
                    return;
                }
                fn(false);
            }).catch (function (error) {
                fn(false, error.message);
            });
        }
    });

    socket.on("create", function (form, fn) {
        var valid = validator.validate(form.email);
        if (!valid) {
            fn(false, "Email address provided not valid");
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

        mysql.record("users", {"username": form.username}).then(function (record) {
            if (!record) {
                var hash = bcrypt.hashSync(form.password, 10);
                mysql.insert("users", {
                    "username"  :   form.username,
                    "password"  :   hash,
                    "email"     :   form.email,
                    "avatar"    :   form.avatar,
                    "health"    :   100
                }).then(function (info){
                    mysql.insert("positions", {
                        "username"  :   form.username,
                        "x"         :   Math.random() * (240 - 0) + 0,
                        "y"         :   Math.random() * (160 - 0) + 0,
                        "facing"    :   "down"
                    }).catch(function (error) {
                        mysql.delete("users", {"username": form.username});

                        fn(false, error.message);
                    });

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
    });

    sockets[session] = socket;
});

function playGame(session, socket, username)
{
    socket.game.player = new Player(username);
    players[username] = socket.game.player;

    socket.game.listeners = {
        "getUsername"   :   function (fn) {
            fn(username);
        },
        "getItems"      :   function (fn) {
            getInventoryItems(username, function (type, message) {
                fn(type, message);
            });
        },
        "nofocus"       :   function () {
            socket.game.player.resetFacing();
            socket.game.player.walking = false;
        },
        "keyPress"      :   function (data) {
            var type = data.type;
            if (!type) {
                return;
            }

            socket.game.player.resetFacing();

            socket.game.player.keys[type] = data.state;

            if (data.state) {
                socket.game.player.facing = type;
                socket.game.player.walking = true;
            } else {
                socket.game.player.walking = false;
            }
        },
        "message"       :   function (data) {
            // Allow server commands if the user is a moderator
            if (data.startsWith("/") && socket.game.player.moderator) {
                var message = data.split(" ");

                // Kill any player specified
                if (message[0] === "/kill") {
                    var user = message[1];
                    if (players.hasOwnProperty(user)) {
                        players[user].die();
                    }
                    return;
                }

                // Teleport the current user to any player
                if (message[0] === "/teleport") {
                    var user = message[1];
                    if (players.hasOwnProperty(user)) {
                        socket.game.player.x = players[user].x;
                        socket.game.player.y = players[user].y
                    }
                    return;
                }

                // Teleport a player to the current user
                if (message[0] === "/summon") {
                    var user = message[1];
                    if (players.hasOwnProperty(user)) {
                        players[user].x = socket.game.player.x;
                        players[user].y = socket.game.player.y;
                    }
                    return;
                }
            }

            // Normal messages
            if (socket.game.player.timeout) {
                clearTimeout(socket.game.player.timeout);
            }

            mysql.insert("messagelog", {
                "username"  :   socket.game.player.id,
                "message"   :   data,
                "date"      :   Math.floor(Date.now() / 1000)
            });

            socket.game.player.message.id = socket.game.player.id + "_" + Math.round((new Date()).getTime() / 1000);
            socket.game.player.message.text = data;

            socket.game.player.timeout = setTimeout(function () {
                socket.game.player.message.id = socket.game.player.id + "_" + Math.round((new Date()).getTime() / 1000);
                socket.game.player.message.text = "";
            }, 4000);
        },
    };

    for (var action in socket.game.listeners) {
        var func = socket.game.listeners[action];

        socket.on(action, func);
    }

    socket.on("logout", function () {
        logoutUser(socket);

        if (socket.game.listeners) {
            // Remove all of the game listeners on the socket.
            for (var action in socket.game.listeners) {
                socket.removeAllListeners(action);
            }
        }

        socket.game = {};
    });

    socket.on("disconnect", function () {
        logoutUser(socket);

        delete sockets[session];
    });
}

function logoutUser(socket)
{
    if (socket.game.player) {
        if (socket.game.player.timeout) {
            clearTimeout(socket.game.player.timeout);
        }

        var username = socket.game.player.id;

        var player = players[username];
        if (!player) {
            return;
        }

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
}

function getInventoryItems(username, callback)
{
    var select = "SELECT b.id, b.name, b.description, a.quantity FROM inventories a ";
    var join = "JOIN items b ON b.id = a.item ";
    var where = "WHERE a.? ";
    var query = select + join + where;

    mysql.query(query, {
        "username"  :   username
    }).then(function (results) {
        callback(true, results);
    }).catch(function (error) {
        callback(false, "Could not get a list of inventory items for this user");
    });
}

setInterval(sendPackets, 1000 / 30);
function sendPackets()
{
    var details = {
        "loggedIn"  :   "",
        "players"   :   [],
        "items"     :   [],
    };

    for (var i in players) {
        var player = players[i];
        player.updatePosition();
        player.updateFrame();

        if (player.hp <= 0) {
            player.die();
        }

        // Check if the player is touching any dropped items
        for (var k in items) {
            var item = items[k];

            var match = areColliding(player, item);
            if (match) {
                player.pickup(item.id, item.quantity);
                delete items[k];
            }
        }

        details.players.push({
            "id"        :   player.id,
            "hp"        :   player.hp,
            "avatar"    :   player.avatar,
            "facing"    :   player.facing,
            "frame"     :   Math.ceil(player.frame),
            "x"         :   player.x,
            "y"         :   player.y,
            "message"   :   {
                "id"        :   player.message.id,
                "text"      :   player.message.text,
            },
        });
    }

    for (var k in items) {
        var item = items[k];
        item.key = k;

        details.items.push(item);
    }

    for (var i in sockets) {
        var socket = sockets[i];

        if (socket.game.player) {
            details.loggedIn = socket.game.player.id;
        }

        socket.emit("details", details);
    }
}

function areColliding(object1, object2)
{
    if (object1.x < object2.x + object2.width  && object1.x + object1.width  > object2.x &&
        object1.y < object2.y + object2.height && object1.y + object1.height > object2.y) {
        return true;
    }

    return false;
}
