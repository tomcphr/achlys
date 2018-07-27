import {Game} from "./Game";
import * as emailValidator from 'email-validator';

export class User
{
    socket: SocketIOClient.Socket;

    constructor (socket: SocketIOClient.Socket)
    {
        this.socket = socket;

        this.prompt("login");
    }

    prompt (type: string)
    {
        var self = this;

        var types = {
            "login"         :   {
                "title"         :   "Login",
                "buttons"       :   [
                    {
                        text: "Register",
                        click: function () {
                            self.prompt("register");
                        }
                    },
                    {
                        text: "Login",
                        click: function () {
                            var username = $("#loginUsername").val().toString();
                            var password = $("#loginPassword").val().toString();

                            self.login(username, password);
                        }
                    }
                ]
            },
            "register"    :     {
                "title"         :   "Register",
                "buttons"       :   [
                    {
                        text: "Back",
                        click: function () {
                            self.prompt("login");
                        }
                    },
                    {
                        text: "Register",
                        click: function () {
                            var email = $("#registerEmail").val().toString();
                            if (!emailValidator.validate(email)) {
                                $.prompt("Email address provided not valid");
                                return;
                            }

                            var username = $("#registerUsername").val().toString();
                            var password = $("#registerPassword").val().toString();
                            var avatar = $("#avatarSelect").val().toString();

                            self.register(email, username, password, avatar);
                        }
                    }
                ]
            }
        }
        if (!types.hasOwnProperty(type)) {
            $.prompt("Invalid type");
            return;
        }

        $(".dialogHtml").hide();

        var html = $("#html_" + type);
        if (!html.length) {
            $.prompt("Something went wrong - no dialog data");
            return;
        }
        html.show();

        var width = html.outerWidth() + 300;
        var height = html.outerHeight() + 300;

        var dialog = types[type];

        $("#loginDialog").dialog({
            title: dialog.title,
            appendTo: "#gameContainer",
            modal: true,
            resizable: false,
            draggable: false,
            closeOnEscape: false,
            height: "auto",
            width: 400,
            open: function (event, ui) {
                var loginDialog = ".ui-dialog[aria-describedby='loginDialog']";
                $(loginDialog).find(".ui-dialog-titlebar-close").remove();
            },
            buttons: dialog.buttons
        });
        $(window).resize(function() {
            $("#loginDialog").dialog("option", "position", {my: "center", at: "center", of: window});
        });
    }

    login (username: string, password: string)
    {
        var self = this;

        var socket = this.socket;
        this.socket.emit("login", {
            "username": username,
            "password": password
        }, function (valid, message) {
            if (!valid) {
                $.prompt(message);
                return;
            }

            $("#loginDialog").dialog("close");

            $("#uiOverlay").show();

            $("#gameContainer").off("click", "#logoutButton");
            $("#gameContainer").on("click", "#logoutButton", function () {
                socket.emit("logout");
                self.logout();
            });

            socket.on("disconnect", function () {
                self.logout();
            });

            $("#userName").html(username);

            var game = new Game(socket);
            game.start();
        });
    }

    register (email: string, username: string, password: string, avatar: string)
    {
        var self = this;
        this.socket.emit("register", {
            "email": email,
            "username": username,
            "password": password,
            "avatar": avatar
        }, function (success, message) {
            if (success) {
                self.login(username, password);
            } else if (message) {
                $.prompt(message);
            }
        });
    }

    logout ()
    {
        // Clear any UI elements from the game
        $("#loginButton").off("click");
        $("#uiOverlay").hide();
        $(".historicMessage").remove();
        $(".ui-dialog-content").dialog("close");

        // Clear the canvas
        var canvas = <HTMLCanvasElement> document.getElementById("ctx");
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Prompt the login screen
        this.prompt("login");
    }
}
