class User {
    constructor (username, session, world, sql, callback) {
        this.width = 32;

        this.height = 32;

        this.session = session;

        this.world = world;

        this.sql = sql;

        this.respawn();

        this.getUserData(username, callback);

        this.message = {
            "id"        :   "",
            "text"      :   "",
            "timeout"   :   null
        };

        this.inventory = new (require("./Inventory"))(sql, session, username);
        this.equipment = new (require("./Equipment"))(sql, session, username);
    };

    getUserData (username, callback) {
        var user = this;
        user.id = username;
        user.loaded = false;

        var fields = {
            "moderator"     :   "a.moderator",
            "avatar"        :   "a.avatar",
            "health"        :   "a.health",
            "x"             :   "b.x",
            "y"             :   "b.y",
            "facing"        :   "b.facing"
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
                if (key == "x" || key == "y" || key == "facing") {
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
        let paths = new (require("./Paths"))(this.world, this);
        let random = paths.getRandomXY();

        this.x = random.x;
        this.y = random.y;
        this.facing = "down";

        this.health = 100;
        this.maxHealth = 100;

        this.frame = 1;
        this.walking = false;
        this.path = [];
        this.reset();
    };

    position () {
        let moveSpeed = 4;
        this.walking = false;
        if (this.path.length) {
            let target = this.path[0];

            if (target.y < this.y) {
                // up
                this.facing = "up";
                if ((this.y - moveSpeed) < target.y) {
                    this.y = target.y;
                } else {
                    this.y -= moveSpeed;
                }
            } else if (target.y > this.y) {
                // down
                this.facing = "down";
                if ((this.y + moveSpeed) > target.y) {
                    this.y = target.y;
                } else {
                    this.y += moveSpeed;
                }
            } else if (target.x > this.x) {
                // right
                this.facing = "right";
                if ((this.x + moveSpeed) > target.x) {
                    this.x = target.x;
                } else {
                    this.x += moveSpeed;
                }
            } else if (target.x < this.x) {
                // left
                this.facing = "left";
                if ((this.x - moveSpeed) < target.x) {
                    this.x = target.x;
                } else {
                    this.x -= moveSpeed;
                }
            }

            this.walking = true;
            if (this.x == target.x && this.y == target.y) {
                this.path.shift();
                this.walking = false;
            }
        }
    };

    reset () {
        this.attacking = {
            "user"      :   "",
            "timeout"   :   null
        };
        this.following = "";
    };

    attack (username) {
        this.attacking.user = username;

        this.follow(username);
    };

    follow (username) {
        this.following = username;
    };

    trade (username) {
        // Trading code goes here.
    };

    damage (amount) {
        this.health -= amount;
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

    getItems (callback) {
        this.inventory.getItems((status, message) =>  {
            callback(status, message);
        });
    };

    pickup (item, quantity) {
        this.inventory.addItem(item, quantity);
    };

    drop (inventoryId, quantity, callback) {
        var x = this.x;
        var y = this.y;

        var droppable = true;
        switch (this.facing) {
            case "left":
                x -= this.width;
                break;
            case "right":
                x += this.width;
                break;
            case "up":
                y -= this.height;
                break;
            case "down":
                y += this.height;
                break;
            default:
                droppable = false;
        }
        if (!droppable) {
            callback(false, "Something went wrong");
            return;
        }

        var self = this;
        this.inventory.dropItem(inventoryId, quantity, (status, message) =>  {
            if (status) {
                self.world.addDrop(message.item, message.name, quantity, x, y);
            }

            callback(status, message);
        });
    };

    equip (inventoryId, quantity, callback) {
        this.equipment.equipItem(inventoryId, quantity, (status, message) =>  {
            callback(status, message);
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

        var totalItems = 0;
        var droppedItems = 0;
        self.getItems((status, message)   =>  {
            if (!status) {
                console.log(message);
                return;
            }

            if (message.length == 0) {
                self.respawn();
                self.loaded = true;
                return;
            }

            for (var key in message) {
                totalItems++;

                var item = message[key];

                self.drop(item.record, item.quantity, (status, message) =>  {
                    if (!status) {
                        console.log(message);
                    }
                    droppedItems++;

                    if (totalItems === droppedItems) {
                        self.respawn();
                        self.session.getSocket().emit("updated-items");
                        self.loaded = true;
                    }
                });
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
