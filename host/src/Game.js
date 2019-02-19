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
            "drop",
            "message",
            "click"
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

    drop (inventoryId, quantity, callback) {
        let self = this;
        this.user.drop(inventoryId, quantity, (status, message)  =>  {
            if (status) {
                self.session.getSocket().emit("updated-items");
            } else {
                console.log("Drop Issue:", status, message);
            }

            callback(status, message);
        })
    };

    click (data) {
        if (!data.type) {
            return;
        }

        if (isNaN(data.x) || isNaN(data.y)) {
            return;
        }

        if (data.type === "right") {
            return;
        }

        // If the user needs to go somewhere, position them accordingly
        if (this.user.x != data.x || this.user.y != data.y) {
            // For now, ensure that we only dealing with map coords since we aren't setting tile map bounds
            if (data.x >= 0 && data.y >= 0) {
                var paths = new (require("./Paths"))(this.world, this.user);
                paths.redirect(data.x, data.y);
            }
        }

    };

    message (text) {
        var message = new (require("./Message"))(this.user, this.world, text);
        message.output();
    };
}
module.exports = Game;
