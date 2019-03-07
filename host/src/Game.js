class Game {
    constructor (username, world) {
        this.session = world.getUserSession(username);
        if (!this.session) {
            throw "Session doesn't exist in the World";
        }

        this.user = this.session.user;
        if (!this.user) {
            throw "No user has logged in to the session";
        }

        this.world = world;

        this.listens = [
            "items",
            "equipped",
            "drop",
            "equip",
            "message",
            "click",
            "follow",
            "menu"
        ];
    };

    start () {
        for (var i = 0; i < this.listens.length; i++) {
            var key = this.listens[i];

            if (typeof this[key] !== "function") {
                throw "Unknown listener: " + key;
            }

            // Bind `this` to each of these events
            // As the current Game class should override
            // the socket context
            var method = this[key].bind(this);

            this.session.getSocket().on(key, method);
        };
    };

    stop () {
        for (var i = 0; i < this.listens.length; i++) {
            var key = this.listens[i];

            this.session.getSocket().removeAllListeners(key);
        };
    };

    items (callback) {
        this.user.getItems((type, message) =>  {
            callback(type, message);
        });
    };

    equipped (callback) {
        this.user.getEquipment((type, message) =>  {
            callback(type, message);
        });
    };

    drop (inventoryId, quantity, callback) {
        let self = this;
        this.user.drop(inventoryId, quantity, (status, message)  =>  {
            if (status) {
                self.session.getSocket().emit("updated-items");
            } else {
                console.log("Drop Issue:", status, message);
            }

            callback(status, message);
        });
    };

    equip (inventoryId, quantity, callback) {
        let self = this;
        this.user.equip(inventoryId, quantity, (status, message)  =>  {
            if (status) {
                self.session.getSocket().emit("updated-items");
            } else {
                console.log("Equip Issue:", status, message);
            }

            callback(status, message);
        });
    };

    click (data) {
        this.user.reset();
        this.user.path = data;
    };

    follow (data) {
        this.user.path = data;
    };

    menu (data) {
        var key = data.key;

        var option = data.option;

        switch (option) {
            case "attack":
                if (key === this.user.id) {
                    break;
                }
                this.user.attack(key);
                break;

            case "trade":
                if (key === this.user.id) {
                    break;
                }
                this.user.trade(key);
                break;

            case "follow":
                this.user.follow(key);
                break;
        }
    };

    message (text) {
        var message = new (require("./Message"))(this.user, this.world, text);
        message.output();
    };
}
module.exports = Game;
