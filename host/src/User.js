class User {
    constructor (username, session, world, sql, callback) {
        this.session = session;

        this.world = world;

        this.sql = sql;

        this.moderator = 0;
        this.width = 32;
        this.height = 32;
        this.avatar = "M";
        this.facing = "down";
        this.frame = 1;
        this.walking = false;
        this.speed = 4;

        this.path = [];

        this.message = {
            "id"        :   "",
            "text"      :   "",
            "timeout"   :   null,
        };

        this.loaded = false;

        this.respawn();

        this.loadUser(username, callback);
    };

    loadUser (username, callback) {
        var user = this;
        user.id = username;

        var fields = {
            "moderator"     :   "a.moderator",
            "avatar"        :   "a.avatar",
            "health"        :   "a.health",
            "x"             :   "b.x",
            "y"             :   "b.y",
            "facing"        :   "b.facing",
        };

        var query = [
            "SELECT " + Object.values(fields).join(","),
            "FROM users a",
            "LEFT OUTER JOIN positions b ON b.username = a.username",
            "WHERE a.?",
            "LIMIT 1",
        ];
        query = query.join(" ");

        this.sql.query(query, {
            "username"  :   username
        }).then((records)    =>  {
            // We should really error here.
            if (records.length > 1) {
                return;
            }

            let record = records[0];
            for (var key in fields) {
                if (key == "x" || key == "y") {
                    if (!record[key]) {
                        this.respawn();
                        continue;
                    }
                }
                if (!record[key]) {
                    continue;
                }
                user[key] = record[key];
            }
            user.loaded = true;

            callback();
        })
        .catch((error)  =>  {
            console.log(error);
        });
    };

    respawn () {
        let tilemap = this.world.getTileMap();

        let positions = [];
        for (var row = 0; row < tilemap.length; row++) {
            for (var col = 0; col < tilemap[row].length; col++) {
                let tile = tilemap[row][col];
                if (tile == 0) {
                    continue;
                }

                positions.push({
                    "x"     :   col * 32,
                    "y"     :   row * 32,
                });
            }
        }
        let random = positions[positions.length * Math.random() | 0];

        this.x = random.x;
        this.y = random.y;

        this.health = 100;
    };

    position () {
        this.walking = false;
        if (this.path.length) {
            let target = this.path[0];

            if (target.y < this.y) {
                // up
                this.facing = "up";
                if ((this.y - this.speed) < target.y) {
                    this.y = target.y;
                } else {
                    this.y -= this.speed;
                }
            } else if (target.y > this.y) {
                // down
                this.facing = "down";
                if ((this.y + this.speed) > target.y) {
                    this.y = target.y;
                } else {
                    this.y += this.speed;
                }
            } else if (target.x > this.x) {
                // right
                this.facing = "right";
                if ((this.x + this.speed) > target.x) {
                    this.x = target.x;
                } else {
                    this.x += this.speed;
                }
            } else if (target.x < this.x) {
                // left
                this.facing = "left";
                if ((this.x - this.speed) < target.x) {
                    this.x = target.x;
                } else {
                    this.x -= this.speed;
                }
            }

            this.walking = true;
            if (this.x == target.x && this.y == target.y) {
                this.path.shift();
                this.walking = false;
            }
        }
    };

    attack () {
    };

    animation () {
        if (this.walking) {
            if (this.frame < 2) {
                this.frame += 0.25;
            } else {
                this.frame = 0;
            }
        } else {
            this.frame = 1;
        }
    };

    items (callback) {
        var query = [
            "SELECT b.id, b.name, b.description, a.quantity",
            "FROM inventories a",
            "JOIN items b ON b.id = a.item",
            "WHERE a.?"
        ];
        query = query.join(" ");

        var params = {
            "username"  :   this.id
        };

        this.sql.query(query, params)
            .then((items)    =>  {
                callback(true, items);
            })
            .catch(()   =>  {
                callback(false, "Could not get the provided user's inventory");
            })
    };

    pickup (item, quantity) {
        var username = this.id;

        var where = {
            "username"  :   username,
            "item"      :   item,
        };

        var self = this;
        this.sql.record("inventories", where)
            .then((record)  =>  {
                if (record) {
                    var update = (parseInt(record.quantity) + parseInt(quantity));

                    self.sql.update("inventories", where, {
                        "quantity"  :   update
                    }).then(()  =>  {
                        self.session.getSocket().emit("updated-items");
                    });

                    return;
                }

                self.sql.insert("inventories", {
                    "username"  :   username,
                    "item"      :   item,
                    "quantity"  :   quantity
                }).then(()  =>  {
                    self.session.getSocket().emit("updated-items");
                });
            });
    };

    drop (item, name, quantity, callback) {
        var self = this;

        var x = this.x;
        var y = this.y;

        var where = {
            "username"  :   this.id,
            "item"      :   item,
        };

        var facing = this.facing;
        var width = this.width;
        var height = this.height;

        this.sql.record("inventories", where)
            .then((record)    =>  {
                if (!record) {
                    return;
                }

                var update = (record.quantity - quantity);
                if (update < 0) {
                    callback(false, "You do not have this many to drop");
                    return;
                }

                var tileWidth = 32;
                var tileHeight = 32;

                switch (facing) {
                    case "left":
                        x -= tileWidth;
                        y += (height - tileHeight);
                        break;
                    case "right":
                        x += width;
                        y += (height - tileHeight);
                        break;
                    case "up":
                        y -= tileHeight;
                        break;
                    case "down":
                        y += ((height) + tileHeight);
                        break;
                }

                if (update > 0) {
                    self.sql.update("inventories", where, {
                        "quantity"  :   update,
                    }).then(()  =>  {
                        self.world.addDrop(item, name, quantity, x, y);

                        callback(true, "Sucessful Drop");
                    }).catch((error) =>  {
                        callback(false, error);
                    })
                } else if (update == 0) {
                    self.sql.delete("inventories", {
                        "id"    :   record.id
                    }).then(()  =>  {
                        self.world.addDrop(item, name, quantity, x, y);

                        callback(true, "Sucessful Drop");
                    }).catch(() =>  {
                        callback(false, error);
                    });
                }
            }).catch((error)    =>  {
                callback(false, error);
            });
    };

    mod (status) {
        var self = this;

        var username = this.id;

        this.sql.record("users", {"username": username})
            .then((user) => {
                if (user !== null) {
                    self.sql.update("users", {"username": username}, {
                        "moderator": status
                    }).then(()  =>  {
                        self.moderator = status;
                    });
                }
            }
        );
    }

    die () {
        var self = this;
        self.loaded = false;
        self.items((status, message)   =>  {
            if (!status) {
                console.log(message);
                return;
            }

            var totalItems = 0;
            var droppedItems = 0;
            for (var key in message) {
                totalItems++;

                var item = message[key];

                self.drop(item.id, item.name, item.quantity, (status, message) =>  {
                    if (!status) {
                        console.log(message);
                    }
                    droppedItems++;
                });
            }

            if (totalItems === droppedItems) {
                self.respawn();
                self.loaded = true;
            }
        })
    };

    save (callback) {
        var self = this;
        if (!self.loaded) {
            return;
        }
        var params = {"username"    :   this.id};

        this.sql.update("users", params, {
            "health"    :   self.health
        }).then(()  =>  {
            let update = {
                "x"         :   self.x,
                "y"         :   self.y,
                "facing"    :   self.facing
            };
            this.sql.updateOrInsert("positions", params, update)
                .then(()   =>  {
                    if (callback) {
                        callback();
                    }
                }).catch((error) =>  {
                    console.log("Something went wrong updating the user's positions:", error);
                });
        }).catch((error)    =>  {
            console.log("Something went wrong updating the user's health:", error);
        });
    };
}
module.exports = User;
