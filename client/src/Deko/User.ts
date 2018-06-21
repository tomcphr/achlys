import {Game} from "./Game";

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
            "login"        :     {
                "title"         :    "Login",
                "buttons"       :    [
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
                "title"         :    "Register",
                "buttons"       :    [
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
                            var username = $("#registerUsername").val().toString();
                            var password = $("#registerPassword").val().toString();
                            var avatar = $(".registerAvatar:checked").val().toString();

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
        }, function (valid) {
            if (!valid) {
                $.prompt("Invalid username and or password");
                return;
            }

            $("#loginDialog").dialog("close");

            $("#uiOverlay").show();

            $("#gameContainer").on("click", "#logoutButton", function () {
                socket.emit("logout");
                $("#loginButton").off("click");
                $("#uiOverlay").hide();
                $(".historicMessage").remove();
                $(".ui-dialog-content").dialog("close");
                self.prompt("login");
            });

            $("#userName").html(username);

            var game = new Game(socket);
            game.start();
        });
    }

    register (email: string, username: string, password: string, avatar: string)
    {
        var self = this;
        this.socket.emit("create", {
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
}
