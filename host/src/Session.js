class Session {
    constructor (sql, socket, world) {
        this.id = Math.random();

        this.sql = sql;
        this.socket = socket;
        this.world = world;

        this.keys = {
            "left"      :   false,
            "right"     :   false,
            "up"        :   false,
            "down"      :   false,
            "space"     :   false
        };

        this.encryption = require("bcrypt");
    };

    getSocket () {
        return this.socket;
    };

    getKeys () {
        return this.keys;
    };

    resetKeys () {
        for (var property in this.keys) {
            if (this.keys.hasOwnProperty(property)) {
                this.keys[property] = false;
            }
        }
    };

    setCurrentKey (type, value) {
        this.resetKeys();

        this.keys[type] = value;
    }

    login (username, password, callback) {
        if (this.world.getUserSession(username)) {
            callback(false, "User already logged in");
            return;
        }

        var self = this;
        this.sql.record("users", {"username": username})
            .then((record) => {
                if (record) {
                    self.encryption.compare(password, record.password)
                        .then((match)   =>  {
                            if (match) {
                                callback(true, "User successfully logged in");
                                return;
                            }

                            callback(false, "Username or password not valid");
                        })
                        .catch ((error) =>  {
                            callback(false, error.message);
                        });

                    return;
                }

                callback(false, "User doesn't exist");
            })
            .catch((error) => {
                callback(false, error.message);
            });
    };

    register (email, username, password, avatar, callback) {
        var validator = require("email-validator");

        email = email.trim();

        var self = this;
        this.sql.record("users", {"email": email})
            .then((record)  =>  {
                if (record) {
                    callback(false, "A user already exists with the provided email address");
                    return;
                }

                var valid = validator.validate(email);
                if (!valid) {
                    callback(false, "Email address provided not valid");
                    return;
                }

                if (!username) {
                    callback(false, "Username cannot be blank");
                    return;
                }
                username = username.toLowerCase();

                if (!password) {
                    callback(false, "Password cannot be blank");
                    return;
                }

                if (!avatar) {
                    callback(false, "A avatar must be selected");
                    return;
                }

                self.sql.record("users", {"username": username})
                    .then((record)  =>  {
                        console.log(record);
                        if (!record) {
                            self.encryption.hash(password, 10)
                                .then((hash)    =>  {
                                    self.sql.insert("users", {
                                        "username"  :   username,
                                        "password"  :   hash,
                                        "email"     :   email,
                                        "avatar"    :   avatar,
                                        "health"    :   100
                                    }).then(()  =>  {
                                        self.sql.insert("positions", {
                                            "username"  :   username,
                                            "x"         :   self.world.getRandomX(),
                                            "y"         :   self.world.getRandomY(),
                                            "facing"    :   "down"
                                        }).catch((error)  =>  {
                                            self.sql.delete("users", {"username": username});

                                            callback(false, error.message);
                                        }).then(()  =>  {
                                            callback(true, "Successfully created user");
                                        });
                                    }).catch((error)  =>  {
                                        callback(false, error.message);
                                    });
                                });

                            return;
                        }

                        callback(false, "Username already exists");
                    }).catch((error)  =>  {
                        callback(false, "Something went wrong: " + error.message);
                    });
            })
            .catch((error)  =>  {
                callback(false, error.message);
            });
    };
}
module.exports = Session;
