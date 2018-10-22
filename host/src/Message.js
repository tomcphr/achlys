class Message {
    constructor (user, world, text) {
        this.user = user;

        this.world = world;

        this.text = text;
    };

    output () {
        if (this.user.moderator) {
            var command = this.getCommand();
            if (command) {
                command.execute();
                return;
            }
        }

        var message = this.user.message;
        if (message.timeout) {
            clearTimeout(this.user.message.timeout);
        }

        var date = Math.round((new Date()).getTime() / 1000);

        var key = "message_" + this.user.id + "_" + date;

        this.user.message = {
            "id"        :   key,
            "text"      :   this.text,
            "timeout"   :   setTimeout(this.timeout.bind(this), 4000)
        };
    };

    getCommand () {
        var syntax = this.text.startsWith("/");
        if (!syntax) {
            return false;
        }

        var params = this.text.slice(1, this.text.length);
        params = params.split(" ");

        var key = params.shift();

        var command = new (require("./Command"))(this.user, this.world, key, params);
        if (!command.canExecute()) {
            return false;
        }

        return command;
    };

    timeout () {
        var key = "message_" + this.user.id + "_" + Math.round((new Date()).getTime() / 1000);

        this.user.message = {
            "id"        :   key,
            "text"      :   "",
            "timeout"   :   null
        };
    };
}
module.exports = Message;
