import io from "socket.io-client";
import Game from "./Game";

class User {
    constructor () {
        this.socket = io();
    }

    login () {
        let username = prompt("Username:");

        let password = prompt("Password:");

        let self = this;
        this.socket.emit("login", {
            "username"  :   username,
            "password"  :   password
        }, (valid, message) =>  {
            if (!valid) {
                alert(message);
                return;
            }

            let game = new Game(self.socket);
            game.start();
        });
    }
}

export default User;
