import io from "socket.io-client";
import Game from "./Game";

class User {
    constructor () {
        this.socket = io();
        
        this.displayForm();
    }

    displayForm () {
        var self = this;

        var loginForm = "<div id='loginForm' class='container'>";
                loginForm += "<label for='username'>Username:</label>";
                loginForm += "<input type='text' class='loginInput' id='usernameInput' placeholder='Username' name='username' required>";
                loginForm += "<label for='password'>Password:</label>";
                loginForm += "<input type='password' class='loginInput' id='passwordInput' placeholder='Password' name='password' required>";
                loginForm += "<button id='loginButton' type='submit'>Login</button>";
            loginForm += "</div>";
        $("#gameContainer").append(loginForm);

        $("#loginButton").click(()  =>  {
            var username = $("#usernameInput").val();
            var password = $("#passwordInput").val();

            self.loginUser(username, password);
        });
    }

    loginUser (username, password) {
        let self = this;
        this.socket.emit("login", {
            "username"  :   username,
            "password"  :   password
        }, (valid, message) =>  {
            if (!valid) {
                alert(message);
                return;
            }

            $("#loginForm").remove();

            let game = new Game(self.socket);
            game.start();
        });
    }
}

export default User;
