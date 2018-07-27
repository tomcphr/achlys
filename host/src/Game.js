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
            "pause",
            "keys",
            "message"
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
        this.user.items((type, message) =>  {
            callback(type, message);
        });
    };

    drop (item, name, quantity, callback) {
        this.user.drop(item, name, quantity, (status, message)  =>  {
            if (!status) {
                console.log(message);
                return;
            }

            callback();
        })
    };

    pause () {
        this.session.resetKeys();

        this.user.walking = false;
    };

    keys (data) {
        var type = data.type;
        if (!type) {
            return;
        }

        var value = data.state;

        this.session.setCurrentKey(type, value);

        if (data.type !== "space") {
            this.user.walking = value;
            if (value) {
                this.user.facing = type;
            }
        }
    };

    message (text) {
        var message = new (require("./Message"))(this.user, this.world, text);
        message.output();
    };
}
module.exports = Game;
