class User {
    constructor (username, session, world, sql) {
        this.session = session;

        this.world = world;

        this.sql = sql;

        this.moderator = 0;
        this.width = 48;
        this.height = 64;
        this.avatar = "M";
        this.facing = "down";
        this.frame = 1;
        this.walking = false;
        this.speed = 8;

        this.message = {
            "id"        :   "",
            "text"      :   "",
            "timeout"   :   null,
        };

        this.loaded = false;

        this.loadUser(username);

        this.respawn();
    };

    loadUser (username) {
        var user = this;
        user.id = username;

        var fields = {
            "moderator"     :   "a.moderator",
            "avatar"        :   "a.avatar",
            "health"        :   "a.health",
            "x"             :   "b.x",
            "y"             :   "b.y",
            "targetX"       :   "b.x",
            "targetY"       :   "b.y",
            "facing"        :   "b.facing",
        };

        var query = [
            "SELECT " + Object.values(fields).join(","),
            "FROM users a",
            "JOIN positions b ON b.username = a.username",
            "WHERE a.?",
            "LIMIT 1",
        ];
        query = query.join(" ");

        this.sql.query(query, {
            "username"  :   username
        }).then((records)    =>  {
            var record = records[0];
            for (var key in fields) {
                user[key] = record[key];
            }
            user.loaded = true;
        })
        .catch((error)  =>  {
            console.log(error.message);
        });
    };

    respawn () {
        this.health = 100;
        this.x = this.world.getRandomX();
        this.y = this.world.getRandomY();
        this.targetX = this.x;
        this.targetY = this.y;
    };

    position (keys) {
        if (keys.right) {
            this.x += this.speed;
            if (this.x > this.targetX) {
                this.targetX += 32;
            }
        } else if (keys.left) {
            this.x -= this.speed;
            if (this.x < this.targetX) {
                this.targetX -= 32;
            }
        } else if (keys.up) {
            this.y -= this.speed;
            if (this.y < this.targetY) {
                this.targetY -= 32;
            }
        } else if (keys.down) {
            this.y += this.speed;
            if (this.y > this.targetY) {
                this.targetY += 32;
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

                var tiles = self.world.getTiles();

                var tileWidth = tiles.getWidth();
                var tileHeight = tiles.getHeight();

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
                        callback(false, error.message);
                    })
                } else if (update == 0) {
                    self.sql.delete("inventories", {
                        "id"    :   record.id
                    }).then(()  =>  {
                        self.world.addDrop(item, name, quantity, x, y);

                        callback(true, "Sucessful Drop");
                    }).catch(() =>  {
                        callback(false, error.message);
                    });
                }
            }).catch((error)    =>  {
                callback(false, error.message);
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
        self.items((status, message)   =>  {
            if (!status) {
                console.log(message);
                return;
            }

            for (var key in message) {
                var item = message[key];

                self.drop(item.id, item.name, item.quantity, (status, message) =>  {
                    if (!status) {
                        console.log(message);
                    }
                });
            }

            self.respawn();
        })
    };

    save (callback) {
        var self = this;

        var params = {"username"    :   this.id};

        this.sql.update("users", params, {
            "health"    :   self.health
        }).then(()  =>  {
            this.sql.update("positions", params, {
                "x"         :   self.x,
                "y"         :   self.y,
                "facing"    :   self.facing
            }).then(()   =>  {
                if (callback) {
                    callback();
                }
            });
        });
    };
}
module.exports = User;
