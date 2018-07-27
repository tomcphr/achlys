class World {
    constructor () {
        this.sessions = {};

        this.items = {};

        this.width = 960;

        this.height = 600;

        this.tiles = new (require("./Tiles"))();
    };

    tick () {
        var self = this;

        var update = () =>  {
            var packet = {
                "players"   :   [],
            };

            for (var s in self.sessions) {
                var session = self.sessions[s];

                var user = self.updateUser(session);
                if (!user) {
                    continue;
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

            packet["items"] = self.getDroppedItems();

            // Send the details of the world to every session
            for (var s in self.sessions) {
                var session = self.sessions[s];

                packet["logged"] = "";
                if (session.user) {
                    packet["logged"] = session.user.id;
                }

                session.getSocket().emit("details", packet);
            };
        };
        setInterval(update, 1000 / 30);
    };

    updateUser (session) {
        if (!session.user) {
            return;
        }

        var user = session.user;
        if (!user.loaded) {
            return;
        }

        var keys = session.getKeys();
        if (keys.space) {
            user.attack();

            // Check if the user is attacking any players
            for (var s in this.sessions) {
                var current = this.sessions[s];
                if (current.id == session.id) {
                    continue;
                }

                if (this.collision(session.user, current.user)) {
                    // Only allow to attack if the user is facing that player.
                    if (current.user.health > 0) {
                        current.user.health -= 5;
                        if (current.user.health < 0) {
                            current.user.health = 0;
                        }
                    }
                }
            }
        }

        user.position(keys);

        user.animation();
        if (user.health <= 0) {
            user.die();
        }

        // Check if the player is touching any dropped items
        for (var i in this.items) {
            var item = this.items[i];

            if (this.collision(user, item)) {
                this.removeDrop(i, function () {
                    user.pickup(item.id, item.quantity);
                });
            }
        }

        return user;
    };

    getDroppedItems () {
        var items = [];
        for (var i in this.items) {
            var item = this.items[i];

            item.key = i;

            items.push(item);
        }
        return items;
    };

    getTiles () {
        return this.tiles;
    };

    addSession (session, user) {
        var id = session.id;

        session["user"] = user;

        this.sessions[id] = session;
    };

    removeSession (session) {
        var id = session.id;

        delete this.sessions[id];
    };

    logout (session) {
        var self = this;
        if (!session.user) {
            self.removeSession(session);
            return;
        }

        session.user.save(()    =>  {
            self.removeSession(session);
        });
    };

    getRandomX () {
        var randomX = Math.random() * (this.width - 0) + 0;

        return Math.ceil(randomX / 32) * 32;
    };

    getRandomY () {
        var randomY = Math.random() * (this.height - 0) + 0;

        return Math.ceil(randomY / 32) * 32;
    };

    getUserSession (username) {
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
    };

    addDrop (item, name, quantity, x, y) {
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
    };

    removeDrop (dropKey, callback) {
        var items = this.items;
        if (!items.hasOwnProperty(dropKey)) {
            return;
        }

        if (callback) {
            callback();
        }

        delete this.items[dropKey];
    };

    collision (object1, object2) {
        var xMatch = object1.x < object2.x + object2.width  && object1.x + object1.width  > object2.x;
        var yMatch = object1.y < object2.y + object2.height && object1.y + object1.height > object2.y;
        if (xMatch && yMatch) {
            return true;
        }

        return false;
    };

    teleport (fromSession, toSession) {
        var fromUser = fromSession.user;
        var toUser = toSession.user;

        if (!fromUser || !toUser) {
            return;
        }

        fromUser.x = toUser.x;
        fromUser.y = toUser.y;

        this.addSession(fromSession);
    };

    kill (username) {
        var session = this.getUserSession(username);
        if (session.user) {
            session.user.die();
            return true;
        }

        return false;
    };
}
module.exports = World;
