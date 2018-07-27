class Command {
    constructor (user, world, key, params) {
        this.user = user;

        this.world = world;

        this.key = key;

        this.params = params;
    };

    canExecute () {
        var key = this.key;
        if (!this[key]) {
            return false;
        }

        var params = this.params;
        if (params.length != this[key].length) {
            return false;
        }

        return true;
    };

    execute () {
        var key = this.key;
        var params = this.params;

        this[key].apply(this, params);
    };

    kill (username) {
        var userSession = this.world.getUserSession(username);
        if (!userSession) {
            return;
        }

        userSession.user.die();
    };

    teleport (username) {
        var currentUser = this.user.id;

        var currentSession = this.world.getUserSession(currentUser);

        var userSession = this.world.getUserSession(username);
        if (!userSession) {
            return;
        }

        currentSession.user.x = userSession.user.x;
        currentSession.user.y = userSession.user.y;

        this.world.addSession(currentSession, currentSession.user);
    };

    summon (username) {
        var userSession = this.world.getUserSession(username);
        if (!userSession) {
            return;
        }

        userSession.user.x = this.user.x;
        userSession.user.y = this.user.y;

        this.world.addSession(userSession, userSession.user);
    };

    spawn (item, quantity) {
        this.user.pickup(item, quantity);
    };

    op (username, status) {
        var userSession = this.world.getUserSession(username);
        if (!userSession) {
            return;
        }

        userSession.user.mod(status);
    };
}
module.exports = Command;
