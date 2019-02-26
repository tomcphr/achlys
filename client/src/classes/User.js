import io from "socket.io-client";
import Game from "./Game";

class User {
    constructor () {
        this.socket = io();
        this.displayForm();
    }

    displayForm () {
        var self = this;

        var loginForm = "<div id='loginForm' class='container loginContainer hidden'>";
                loginForm += "<label for='username'>Username:</label>";
                loginForm += "<input type='text' class='loginInput' id='usernameLogin' placeholder='Username' name='username' required>";
                loginForm += "<label for='password'>Password:</label>";
                loginForm += "<input type='password' class='loginInput' id='passwordLogin' placeholder='Password' name='password' required>";
                loginForm += "<button id='registerButton' type='submit'>Register</button>";
                loginForm += "<button id='loginButton' type='submit'>Login</button>";
            loginForm += "</div>";
        $("#userForm").append(loginForm);
        var regiForm = "<div id='regiForm' class='container loginContainer hidden'>";
                regiForm += "<label for='email'>Email:</label>";
                regiForm += "<input type='text' class='loginInput' id='emailRegister' placeholder='Email' name='email' required>";
                regiForm += "<label for='username'>Username:</label>";
                regiForm += "<input type='text' class='loginInput' id='usernameRegister' placeholder='Username' name='username' required>";
                regiForm += "<label for='password'>Password:</label>";
                regiForm += "<input type='password' class='loginInput' id='passwordRegister' placeholder='Password' name='password' required>";
                regiForm += "<button id='backButton' type='submit'>Back</button>";
                regiForm += "<button id='createUserButton' type='submit'>Create</button>";
            regiForm += "</div>";
        $("#userForm").append(regiForm);

        this.displayLogin();
    }

    displayLogin () {
        let self = this;

        $("#regiForm").hide();
        $("#loginForm").show();

        $("#loginButton").off("click");
        $("#loginButton").on("click", ()   =>  {
            $("#loginButton").off("click");

            var username = $("#usernameLogin").val();
            var password = $("#passwordLogin").val();

            self.loginUser(username, password);
        });

        $("#registerButton").off("click");
        $("#registerButton").on("click", ()   =>  {
            self.displayRegister();
        });
    }

    displayRegister () {
        let self = this;

        $("#loginForm").hide();
        $("#regiForm").show();

        $("#backButton").off("click");
        $("#backButton").on("click", ()   =>  {
            self.displayLogin();
        });

        $("#createUserButton").off("click");
        $("#createUserButton").on("click", () =>  {
            $("#createUserButton").off("click");

            var email = $("#emailRegister").val();
            var username = $("#usernameRegister").val();
            var password = $("#passwordRegister").val();

            // TODO - User create avatar correctly
            self.createUser(email, username, password, "F");
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

            $("#loginForm").hide();

            let game = new Game(self.socket);

            self.socket.off("disconnect");
            self.socket.on("disconnect", () =>  {
                alert("Lost connection to the server");
                game.stop();
                self.displayLogin();
            });

            self.socket.off("logout");
            self.socket.on("logout", (reason)   =>  {
                if (!reason) {
                    reason = "Disconnected from the server";
                }
                alert(reason);
                game.stop();
                self.displayLogin();
            });
        });
    }

    createUser (email, username, password, avatar) {
        let self = this;
        this.socket.emit("register", {
            "email"     :   email,
            "username"  :   username,
            "password"  :   password,
            "avatar"    :   avatar
        }, (valid, message) =>  {
            if (!valid) {
                alert(message);
                return;
            }

            $("#regiForm").hide();

            self.loginUser(username, password);
        });
    }
}

export default User;
