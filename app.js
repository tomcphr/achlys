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

let world = {
    sessions: {},
    items: {},

    addSession: function (session) {
        this.sessions[session.id] = session;
    },

    removeSession: function (session) {
        delete this.sessions[session.id];
    },

    removeUser: function (session) {
        if (this.sessions.hasOwnProperty(session.id)) {
            var session = this.sessions[session.id];

            var user = session.user;
            if (user) {
                var params = {"username"  :  user.id};
                mysql.update("users", params, {
                    "health"    :   user.health
                });
                mysql.update("positions", params, {
                    "x"         :   user.x,
                    "y"         :   user.y,
                    "facing"    :   user.facing
                });
            }

            this.sessions[session.id].user = null;
        }
    },

    getUserSession: function (username) {
        for (var session in this.sessions) {
            var session = this.sessions[session];

            var user = session.user;
            if (!user) {
                continue;
            }

            if (user.id === username) {
                return session;
            }
        }

        return false;
    },

    addDrop: function (item, name, quantity, x, y) {
        var self = this;

        // Use setTimeout to ensure we get a unique item drop identifier
        setTimeout(function () {
            var key = "drop_" + item + "_" + quantity + "_" + Math.round((new Date()).getTime() / 1000);

            self.items[key] = {
                "id"        :   item,
                "name"      :   name,
                "quantity"  :   quantity,
                "x"         :   x,
                "y"         :   y,
                "width"     :   32,
                "height"    :   32,
            };
        }, 250);
    },

    removeDrop: function (dropKey, callback) {
        if (!this.items.hasOwnProperty(dropKey)) {
            return;
        }

        if (callback) {
            callback();
        }

        delete this.items[dropKey];
    },

    collision: function (object1, object2) {
        if (object1.x < object2.x + object2.width  && object1.x + object1.width  > object2.x &&
            object1.y < object2.y + object2.height && object1.y + object1.height > object2.y) {
            return true;
        }

        return false;
    },

    teleport: function (fromSession, toSession) {
        var fromUser = fromSession.user;
        var toUser = toSession.user;

        if (!fromUser || !toUser) {
            return;
        }

        fromUser.x = toUser.x;
        fromUser.y = toUser.y;

        this.addSession(fromSession);
    },

    kill: function (username) {
        var session = this.getUserSession(username);
        if (session.user) {
            session.user.die();
            return true;
        }

        return false;
    },
};

var io = require("socket.io")(host, {});
io.sockets.on("connection", function (socket) {
    var session = getSession(socket, world, mysql, bcrypt);

    socket.on("login", function (form, callback) {
        if (!form.username || !form.password) {
            callback(false, "Invalid user details provided");
            return;
        }

        var username = form.username.toLowerCase();

        session.login(username, form.password, function (status, message) {
            if (status) {
                var user = getUser(username, socket, mysql);
                session.setUser(user);

                world.addSession(session);

                var game = getGame(session, world, mysql);
                game.start();
            }

            callback(status, message);
        });
    });

    socket.on("create", function (form, callback) {
        var valid = validator.validate(form.email);
        if (!valid) {
            callback(false, "Email address provided not valid");
            return;
        }

        var username = form.username.toLowerCase();
        if (!username) {
            callback(false, "Username cannot be blank");
            return;
        }

        if (!form.password) {
            callback(false, "Password cannot be blank");
            return;
        }

        if (!form.avatar) {
            callback(false, "A avatar must be selected");
            return;
        }

        mysql.record("users", {"username": form.username})
            .then(function (record) {
                if (!record) {
                    bcrypt.hash(form.password, 10)
                        .then(function(hash) {
                            mysql.insert("users", {
                                "username"  :   form.username,
                                "password"  :   hash,
                                "email"     :   form.email,
                                "avatar"    :   form.avatar,
                                "health"    :   100
                            }).then(function (){
                                mysql.insert("positions", {
                                    "username"  :   form.username,
                                    "x"         :   Math.random() * (960 - 0) + 0,
                                    "y"         :   Math.random() * (600 - 0) + 0,
                                    "facing"    :   "down"
                                }).catch(function (error) {
                                    mysql.delete("users", {"username": form.username});

                                    callback(false, error.message);
                                }).then(function () {
                                    callback(true, "Successfully created user");
                                });
                            }).catch(function (error) {
                                callback(false, error.message);
                            });
                        });

                    return;
                }

                fn(false, "Username already exists");
            }).catch(function (error) {
                fn(false, "Something went wrong: " + error.message);
            });
    });

    socket.on("logout", function () {
        world.removeUser(session);

        var game = getGame(session, world, mysql);
        game.stop();
    })

    socket.on("disconnect", function () {
        if (session.user) {
            world.removeUser(session);
        }
        world.removeSession(session);
    });
});

function getSession (socket, world, mysql, bcrypt) {
    let session = {
        id: Math.random(),

        user: null,

        keys: {
            "left"      :   false,
            "right"     :   false,
            "up"        :   false,
            "down"      :   false,
        },

        getSocket: function () {
            return socket;
        },

        setUser: function (user) {
            this.user = user;
        },

        login: function (username, password, callback) {
            if (world.getUserSession(username)) {
                callback(false, "User already logged in");
                return;
            }

            mysql.record("users", {"username": username}).then(function (record) {
                if (record) {
                    bcrypt.compare(password, record.password)
                        .then(function(match) {
                            if (match) {
                                callback(true, "User successfully logged in");
                            } else {
                                callback(false, "Username or password not valid");
                            }
                        });

                    return;
                }
                callback(false, "User doesn't exist");
            }).catch (function (error) {
                callback(false, error.message);
            });
        }
    };

    return session;
}

function getUser (username, socket, mysql) {
    let user = {
        id: username,
        x: Math.random() * (960 - 0) + 0,
        y: Math.random() * (600 - 0) + 0,
        width: 24,
        height: 32,
        moderator: 0,
        health: 100,
        avatar: "M",
        facing: "down",
        frame: 1,
        walking: false,
        speed: 9,
        loaded: false,

        message: {
            "id"        :   "",
            "text"      :   "",
            "timeout"   :   null,
        },

        position: function (keys) {
            if (keys.right) {
                this.x += this.speed;
            } else if (keys.left) {
                this.x -= this.speed;
            } else if (keys.up) {
                this.y -= this.speed;
            } else if (keys.down) {
                this.y += this.speed;
            }
        },

        animation: function () {
            if (this.walking) {
                if (this.frame < 2) {
                    this.frame += 0.25;
                } else {
                    this.frame = 0;
                }
            } else {
                this.frame = 1;
            }
        },

        pickup: function (item, quantity) {
            var where = {
                "username"  :   username,
                "item"      :   item,
            };

            mysql.record("inventories", where)
                .then(function (record) {
                    if (!record) {
                        mysql.insert("inventories", {
                            "username"  :   username,
                            "item"      :   item,
                            "quantity"  :   quantity,
                        }).then(function () {
                            socket.emit("updated-items");
                        });
                    } else {
                        var update = (parseInt(record.quantity) + parseInt(quantity));

                        mysql.update("inventories", where, {
                            "quantity"  :   update,
                        }).then(function () {
                            socket.emit("updated-items");
                        });
                    }
                });
        },

        drop: function (item, name, quantity, x, y, callback) {
            if (!x || !y) {
                x = this.x;
                y = this.y;
            }

            var where = {
                "username"  :   username,
                "item"      :   item,
            };

            var facing = this.facing;
            var width = this.width;
            var height = this.height;

            mysql.record("inventories", where)
                .then(function (record) {
                    if (!record) {
                        return;
                    }

                    var update = (record.quantity - quantity);
                    if (update < 0) {
                        callback(false, "You do not have this many to drop");
                        return;
                    }

                    switch (facing) {
                        case "left":
                            x -= (width * 2);
                            break;
                        case "right":
                            x += (width * 2);
                            break;
                        case "up":
                            y -= (height * 2);
                            break;
                        case "down":
                            y += (height * 2);
                            break;
                    }

                    if (update > 0) {
                        mysql.update("inventories", where, {
                            "quantity"  :   update,
                        }).then(function () {
                            world.addDrop(item, name, quantity, x, y);
                            callback(true, "Successful drop");
                        }).catch(function (error) {
                            callback(false, error.message);
                        });
                    } else if (update == 0) {
                        mysql.delete("inventories", {
                            id: record.id
                        }).then(function () {
                            world.addDrop(item, name, quantity, x, y);
                            callback(true, "Successful drop");
                        }).catch(function (error) {
                            callback(false, error.message);
                            return;
                        });
                    }
                }).catch(function (error) {
                    callback(false, error.message);
                });
        },

        die: function () {
            var self = this;
            getInventory(mysql, username, function (status, inventory) {
                if (status) {
                    for (var key in inventory) {
                        var item = inventory[key];

                        self.drop(item.id, item.name, item.quantity, self.x, self.y, function (status, message) {
                            if (!status) {
                                console.log(message);
                            }
                        });
                    }
                }

                self.x = Math.random() * (960 - 0) + 0;
                self.y = Math.random() * (600 - 0) + 0;

                self.health = 100;
            });
        },
    };

    var select = "SELECT a.moderator, a.avatar, a.health, b.x, b.y, b.facing FROM users a ";
    var join = "JOIN positions b ON b.username = a.username ";
    var where = "WHERE a.? ";
    var limit = "LIMIT 1";
    var query = select + join + where + limit;

    mysql.query(query, {
        "username"  :   username
    }).then(function (data) {
        user.moderator = data[0].moderator;
        user.avatar = data[0].avatar;
        user.health = data[0].health;
        user.x = data[0].x;
        user.y = data[0].y;
        user.facing = data[0].facing;
    }).catch(function (error) {
        console.log(error.message);
    });

    return user;
}

function getGame (session, world, mysql)
{
    let game = {
        commands: {
            "kill"      :   function (username) {
                world.kill(username);
            },
            "teleport"  :   function (username) {
                var toSession = world.getUserSession(username);

                world.teleport(session, toSession);
            },
            "summon"    :   function (username) {
                var fromSession = world.getUserSession(username);

                world.teleport(fromSession, session);
            },
            "spawn"      :   function (command) {
                var params = command.split(" ");

                var item = params[0];
                var quantity = params[1];

                var user = session.user;
                if (!user) {
                    return;
                }

                user.pickup(item, quantity);
            }
        },

        listens: {
            "items"  :   function (callback) {
                if (!session.user) {
                    return;
                }
                getInventory(mysql, session.user.id, function (type, message) {
                    callback(type, message);
                });
            },
            "drop"      :   function (item, name, quantity, callback) {
                if (!session.user) {
                    return;
                }

                var x = session.user.x;
                var y = session.user.y;

                session.user.drop(item, name, quantity, x, y, function (status, message) {
                    if (!status) {
                        console.log(message);
                        return;
                    }

                    callback();
                });
            },
            "pause"     :   function () {
                for (var property in session.keys) {
                    if (session.keys.hasOwnProperty(property)) {
                        session.keys[property] = false;
                    }
                }
                if (!session.user) {
                    return;
                }
                session.user.walking = false;
            },
            "keys"      :   function (data) {
                var type = data.type;
                if (!type) {
                    return;
                }

                for (var property in session.keys) {
                    if (session.keys.hasOwnProperty(property)) {
                        session.keys[property] = false;
                    }
                }

                var value = data.state;
                session.keys[type] = value;

                if (!session.user) {
                    return;
                }

                session.user.walking = value;
                if (value) {
                    session.user.facing = type;
                }
            },
            "message"   :   function (text) {
                var user = session.user;
                if (!user) {
                    return;
                }

                // Check if the message is a command and if so parse it accordingly
                if (text.startsWith("/") && user.moderator) {
                    var message = text.split(" ");

                    var command = message[0].split("/");

                    var type = command[1];
                    if (game.commands.hasOwnProperty(type)) {
                        var params = "";

                        for (var i = 1; i < message.length; i++) {
                            params += message[i] + " ";
                        }

                        params = params.trim();

                        game.commands[type](params);

                        return;
                    }
                }

                if (user.message.timeout) {
                    clearTimeout(user.message.timeout);
                }

                user.message.id = "message_" + user.id + "_" + Math.round((new Date()).getTime() / 1000);
                user.message.text = text;

                user.message.timeout = setTimeout(function () {
                    user.message.id = "message_" + user.id + "_" + Math.round((new Date()).getTime() / 1000);
                    user.message.text = "";
                }, 4000);
            },
        },

        start: function () {
            for (var action in this.listens) {
                var method = this.listens[action];

                session.getSocket().on(action, method);
            }
        },

        stop: function () {
            for (var action in this.listens) {
                session.getSocket().removeAllListeners(action);
            }
        }
    };

    return game;
}

function getInventory(mysql, username, callback)
{
    var select = "SELECT b.id, b.name, b.description, a.quantity FROM inventories a ";
    var join = "JOIN items b ON b.id = a.item ";
    var where = "WHERE a.? ";
    var query = select + join + where;

    mysql.query(query, {
        "username"  :   username
    }).then(function (data) {
        callback(true, data);
    }).catch(function (error) {
        callback(false, "Could not get a list of inventory items for this user");
    });
}

setInterval(function () {
    var packet = {
        "logged"    :   "",
        "players"   :   [],
        "items"     :   [],
    };

    for (var s in world.sessions) {
        var session = world.sessions[s];

        if (session.user) {
            var user = session.user;
            user.position(session.keys);
            user.animation();
            if (user.health <= 0) {
                user.die();
            }

            // Check if the player is touching any dropped items
            for (var i in world.items) {
                var item = world.items[i];

                if (world.collision(user, item)) {
                    world.removeDrop(i, function () {
                        user.pickup(item.id, item.quantity);
                    });
                }
            }

            packet.players.push({
                "id"        :   user.id,
                "health"    :   user.health,
                "avatar"    :   user.avatar,
                "facing"    :   user.facing,
                "frame"     :   Math.ceil(user.frame),
                "x"         :   user.x,
                "y"         :   user.y,
                "message"   :   {
                    "id"        :   user.message.id,
                    "text"      :   user.message.text,
                },
            });
        }
    }

    // Get a list of all items in the world
    for (var i in world.items) {
        var item = world.items[i];

        item.key = i;

        packet.items.push(item);
    }

    // Send the details of the world to every session
    for (var s in world.sessions) {
        var session = world.sessions[s];

        if (session.user) {
            packet.logged = session.user.id;
        }

        session.getSocket().emit("details", packet);
    }
}, 1000 / 30);
