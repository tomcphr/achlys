// Allow the user of the JQuery impromptu plugin
interface JQueryStatic {
    prompt: any;
}

module Deko {
    export class Main
    {
        canvas;
        ctx: CanvasRenderingContext2D;
        socket: SocketIOClient.Socket;

        width: number;
        height: number;

        constructor (socket)
        {
            this.socket = socket;

            this.canvas = document.getElementById("ctx");
            this.ctx = this.canvas.getContext("2d");
            this.ctx.font = "16px Verdana";
            this.ctx.textAlign = "center";

            this.width = this.canvas.width;
            this.height = this.canvas.height;
        }

        start (username)
        {
            var self = this;

            self.socket.emit("login", username);

            var player = new Deko.Player(self.ctx);
            this.socket.on("details", function (data) {
                self.ctx.clearRect(0, 0, self.width, self.height);

                for (var i = 0; i < data.length; i++) {
                    var x = data[i].x;
                    var y = data[i].y;
                    var gender = data[i].gender;
                    var facing = data[i].facing;
                    var frame = data[i].frame;

                    player.draw(x, y, gender, facing, frame);

                    var hp = data[i].hp;
                    var message = data[i].message;
                    var user = data[i].id;
                    player.interface(x, y, message, user, hp);
                }
            });

            this.listeners();
        }

        listeners ()
        {
            var self = this;

            self.canvas.onkeydown = function (event) {
                var type = self.pressKey(event.keyCode);
                self.socket.emit("keyPress", {
                    "type"  :   type,
                    "state" :   true,
                });
            }

            self.canvas.onkeyup = function (event) {
                var type = self.pressKey(event.keyCode);
                self.socket.emit("keyPress", {
                    "type"  :   type,
                    "state" :   false,
                });
            }

            $("#ctx").focusout(function () {
                self.socket.emit("nofocus");
            });
        }

        pressKey (key)
        {
            switch (key) {
                case 68:
                case 39:
                    return "right";

                case 83:
                case 40:
                    return "down";

                case 65:
                case 37:
                    return "left";

                case 87:
                case 38:
                    return "up";

                default:
                    return 0;
            }
        }
    }

    export class User
    {
        socket: SocketIOClient.Socket;

        constructor (socket)
        {
            this.socket = socket;
        }

        login (username: string, password: string)
        {
            var self = this;
            var socket = this.socket;
            this.socket.emit("validate", {
                "username": username,
                "password": password
            }, function (valid) {
                if (!valid) {
                    self.error("Invalid username provided", true);
                    return;
                }

                var game = new Deko.Main(socket);
                game.start(username);
            });

        }

        register (email: string, username: string, password: string, gender: string)
        {
            var self = this;
            this.socket.emit("create", {
                "email": email,
                "username": username,
                "password": password,
                "gender": gender
            }, function (success, message) {
                if (success) {
                    self.login(username, password);
                    $.prompt.close();
                } else if (message) {
                    self.error(message);
                }
            });
        }

        error (message, createPrompt: boolean = false)
        {
            var prompt = {
                buttons: {Ok: "ok"},
                submit: function (event) {
                    event.preventDefault();

                    if (createPrompt) {
                        $.prompt.close();
                    } else {
                        $.prompt.prevState();
                    }
                }
            };
            if (createPrompt) {
                $.prompt(message, prompt);
            } else {
                prompt["html"] = message;
                $.prompt.removeState("error");
                $.prompt.addState("error", prompt);
                $.prompt.goToState("error", true);
            }
        }
    }

    export class Player
    {
        ctx: CanvasRenderingContext2D;
        width: number = 24;
        height: number = 32;
        images: object = {};

        constructor (ctx: CanvasRenderingContext2D)
        {
            this.ctx = ctx;

            var genders = [
                "M",
                "F",
            ];
            for (var i = 0; i < genders.length; i++) {
                var gender = genders[i];

                var image = new Image();
                image.src = "/img/player_" + gender + ".png";

                this.images[gender] = image;
            }
        }

        draw (x: number, y: number, gender: string, facing: string, frame: number)
        {
            switch (facing) {
                case "up":
                    var imageY = 0;
                    break;

                case "right":
                    var imageY = this.height;
                    break;

                case "down":
                    var imageY = this.height * 2;
                    break;

                case "left":
                    var imageY = this.height * 3;
                    break;
            }

            this.ctx.drawImage(
                this.images[gender],
                this.width * frame,
                imageY,
                this.width,
                this.height,
                x,
                y,
                this.width * 3,
                this.height * 3
            );
        }

        interface (x, y, message, user, hp)
        {
            x = (x + ((this.width * 3) / 2));

            this.displayText(user, x, (y + 5));

            this.displayText(message, x, (y - 15));

            // Display the health bar.
            var totalBarWidth = 50;
            var barY = (y + (this.height * 3)) + 7;
            var barWidth = (hp / 100) * totalBarWidth;
            var barX = x - (totalBarWidth / 2);
            var barHeight = 5;

            // Create the border for the Health bar
            this.ctx.fillStyle = "#000000";
            this.ctx.fillRect(barX - 1, barY - 1, totalBarWidth + 2, barHeight + 2);
            this.ctx.fillStyle = "#FF0000";
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
        }

        displayText (text, x, y)
        {
            this.ctx.fillStyle = "#000000";

            this.ctx.fillText(text, x, y);
        }
    }
}

window.onload = () => {
    var socket = io();

    var user = new Deko.User(socket);

    $("#loginButton").click(function () {
        var username = $("#loginUsername").val().toString();
        var password = $("#loginPassword").val().toString();
        user.login(username, password);
    });

    $("#signupButton").click(function () {
        var html = $("#registerForm").html();

        $.prompt(html, {
            title: "Register",
            buttons: {"Create": "create"},
            submit: function (event, value, message, form) {
                event.preventDefault();

                user.register(
                    form.registerEmail,
                    form.registerUsername,
                    form.registerPassword,
                    form.registerGender
                );
            }
        })
    });

    $("#messageText").on("keyup", function (event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            $("#sendMessage").click();
        }
    });
    $("#sendMessage").click(function () {
        var message = $("#messageText").val();

        socket.emit("message", message);

        $("#messageText").val("");
    });
}
