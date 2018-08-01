import {World} from "./World";
import {Inventory} from "./Inventory";
import {RenderEngine} from "./RenderEngine";

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
        var engine = new RenderEngine(ctx, self.width, self.height);
        this.socket.on("details", function (data) {
            ctx.clearRect(0, 0, self.width, self.height);

            let logged = data.logged;
            if (!logged) {
                return;
            }

            let players = data.players;

            let currentPlayer = players[logged];
            if (!currentPlayer.loaded) {
                return;
            }

            let globalX = ((self.width / 2) - currentPlayer.x);
            let globalY = ((self.height / 2) - currentPlayer.y);

            engine.render(data.world.tiles, globalX, globalY);

            // Draw all of the other players
            for (let id in players) {
                let otherPlayer = players[id];
                if (!otherPlayer.loaded) {
                    continue;
                }

                let isUser = (id === logged);
                if (isUser) {
                    continue;
                }

                otherPlayer.x = globalX + otherPlayer.x;
                otherPlayer.y = globalY + otherPlayer.y;

                world.drawPlayer(otherPlayer, false);
            }

            let items = data.items;
            for (let i = 0; i < items.length; i++) {
                let item = items[i];

                item.x = globalX + item.x;
                item.y = globalY + item.y;

                world.drawItem(item.x, item.y, item.id);
            }

            let clientPlayer = Object.assign({}, currentPlayer);
            clientPlayer.x = self.width / 2;
            clientPlayer.y = self.height / 2;
            world.drawPlayer(clientPlayer, true);
        });

        let inventory = new Inventory(this.socket);
        let invenDialog = inventory.class;
        $("#inventoryButton").click(function () {
            if (!$(invenDialog).is(":visible")) {
                inventory.open();
            }
        });
        self.socket.on("updated-items", function () {
            if ($(invenDialog).is(":visible")) {
                inventory.showItems();
            }
        });

        this.keyboard();
    }

    keyboard ()
    {
        var self = this;

        window.onkeydown = function (event) {
            let enteringText = $("#messageText").is(":focus");
            if (enteringText) {
                return;
            }
            let type = self.pressKey(event.keyCode);
            self.socket.emit("keys", {
                "type"  :   type,
                "state" :   true,
            });
        }

        window.onkeyup = function (event) {
            let type = self.pressKey(event.keyCode);
            self.socket.emit("keys", {
                "type"  :   type,
                "state" :   false,
            });
        }

        $(window).blur(function() {
            self.socket.emit("pause");
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

            case 32:
                return "space";

            default:
                return 0;
        }
    }
}
