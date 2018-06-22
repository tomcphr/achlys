import {World} from "./World";
import {Inventory} from "./Inventory";

export class Game
{
    socket: SocketIOClient.Socket;

    canvas;

    width: number;
    height: number;

    constructor (socket: SocketIOClient.Socket)
    {
        this.socket = socket;

        this.canvas = document.getElementById("ctx");
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    start ()
    {
        var self = this;

        var ctx = this.canvas.getContext("2d");
        ctx.font = "16px Verdana";
        ctx.textAlign = "center";

        var world = new World(this.socket, ctx);
        this.socket.on("details", function (data) {
            ctx.clearRect(0, 0, self.width, self.height);

            var loggedIn = data.loggedIn;
            if (!loggedIn) {
                return;
            }
            var players = data.players;
            for (var i = 0; i < players.length; i++) {
                var player = players[i];

                var object = world.drawObject(player.x, player.y, player.avatar, player.facing, player.frame);

                var hudX = (player.x + ((object.getWidth() * object.getScale()) / 2));

                var increment = 5;
                if (player.id != loggedIn) {
                    world.drawMessage(hudX, (player.y + increment), player.id);
                    increment += 12.5;
                }

                if (player.message.id && player.message.text) {
                    world.drawMessage(hudX, (player.y - increment), player.message.text);
                    if ($("#" + player.message.id).length == 0) {
                        $("#messageHistory").append("<div id='" + player.message.id + "' class='historicMessage'>" + player.id + ": " + player.message.text + "</div>");
                    }
                }

                var healthWidth = 50;
                world.drawHealth((hudX - (healthWidth / 2)), (player.y + (object.getHeight() * object.getScale())) + 7, player.hp, healthWidth);
            }
        });

        var inventory = new Inventory(this.socket);
        $("#inventoryButton").click(function () {
            var invenDialog = ".ui-dialog[aria-describedby='inventoryDialog']";
            if (!$(invenDialog).is(":visible")) {
                inventory.open();
            }
        });

        this.keyboard();
    }

    keyboard ()
    {
        var self = this;

        window.onkeydown = function (event) {
            var enteringText = $("#messageText").is(":focus");
            if (enteringText) {
                return;
            }
            var type = self.pressKey(event.keyCode);
            self.socket.emit("keyPress", {
                "type"  :   type,
                "state" :   true,
            });
        }

        window.onkeyup = function (event) {
            var type = self.pressKey(event.keyCode);
            self.socket.emit("keyPress", {
                "type"  :   type,
                "state" :   false,
            });
        }

        $(window).blur(function() {
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
