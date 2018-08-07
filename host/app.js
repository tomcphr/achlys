let sql = require("node-mysql-helper");

let json = (require("fs")).readFileSync(__dirname + "/database.json");
let database = JSON.parse(json).dev;

let mapFile = (require("fs")).readFileSync(__dirname + "/map.json");
let map = JSON.parse(mapFile).tiles;

sql.connect({
    host        :   database.host,
    user        :   database.user,
    password    :   database.password,
    database    :   database.database
});

let serve = new (require("./src/Serve"))();
serve.listen();

let world = new (require("./src/World"))(map);
world.tick();

serve.getIo().sockets.on("connection", (socket)  =>  {
    var session = new (require("./src/Session"))(sql, socket, world);

    socket.on("login", (form, callback) => {
        if (!form.username || !form.password) {
            callback(false, "Invalid user details provided");
            return;
        }

        var username = form.username.toLowerCase();

        session.login(username, form.password, (status, message) => {
            // If we have sucessfully logged in, start the game listeners.
            if (status) {
                var user = new (require("./src/User"))(username, session, world, sql, ()    =>  {
                    world.addSession(session, user);

                    var game = new (require("./src/Game"))(username, world);
                    game.start();

                    socket.on("logout", ()  =>  {
                        game.stop();

                        world.logout(session);

                        // Since we can login and logout in the same session
                        // We need to remove the logout listener each time
                        // The login listener is called.
                        socket.removeAllListeners("logout");
                    });
                });

            }

            callback(status, message);
        });
    });

    socket.on("register", (form, callback)  =>  {
        session.register(form.email, form.username, form.password, form.avatar, (status, message)  =>  {
            callback(status, message);
        });
    });

    socket.on("disconnect", ()  =>  {
        world.logout(session);
    });
});
