import {WorldObject} from "./WorldObject";

export class World
{
    socket: SocketIOClient.Socket;
    ctx: CanvasRenderingContext2D;

    images: object = {};

    constructor (socket: SocketIOClient.Socket, ctx: CanvasRenderingContext2D)
    {
        this.socket = socket;

        this.ctx = ctx;

        var sprites = [
            "M",
            "F",
            "item_1",
            "item_2",
            "item_3",
        ];
        for (var i = 0; i < sprites.length; i++) {
            var sprite = sprites[i];

            var image = new Image();
            image.src = "/img/images/" + sprite + ".png";

            this.images[sprite] = image;
        }
    }

    drawPlayer (player, isUser)
    {
        var object = this.drawObject(player.x, player.y, player.avatar, player.facing, player.frame);

        var hudX = (player.x + ((object.getWidth() * object.getScale()) / 2));

        var increment = 5;
        if (!isUser) {
            this.drawMessage(hudX, (player.y + increment), player.id);
            increment += 12.5;
        }

        if (player.message.id && player.message.text) {
            this.drawMessage(hudX, (player.y - increment), player.message.text);
            if ($("#" + player.message.id).length == 0) {
                $("#messageHistory").append("<div id='" + player.message.id + "' class='historicMessage'>" + player.id + ": " + player.message.text + "</div>");
            }
        }

        var healthWidth = 50;
        this.drawHealth((hudX - (healthWidth / 2)), (player.y + (object.getHeight() * object.getScale())) + 7, player.health, healthWidth);
    }

    drawObject (x: number, y: number, avatar: string, facing: string, frame: number)
    {
        var width = 24;
        var height = 32;

        var innerX = width * frame;
        switch (facing) {
            case "up":
                var innerY = 0;
                break;

            case "right":
                var innerY = height;
                break;

            case "down":
                var innerY = height * 2;
                break;

            case "left":
                var innerY = height * 3;
                break;
        }

        var object = new WorldObject(this.ctx, this.images[avatar], width, height);
        object.scaleBy(2);
        object.draw(x, y, innerX, innerY);

        return object;
    }

    drawItem (x: number, y: number, itemId: number)
    {
        var object = new WorldObject(this.ctx, this.images["item_" + itemId], 32, 32);
        object.scaleBy(1);
        object.draw(x, y, 0, 0);
    }

    drawMessage (x: number, y: number, message: string)
    {
        this.ctx.fillStyle = "#000000";

        this.ctx.fillText(message, x, y);
    }

    drawHealth (x: number, y: number, hp: number, width: number = 50, height: number = 5)
    {
        // Create the border for the health bar
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

        // Create the health bar
        this.ctx.fillStyle = "#FF0000";
        this.ctx.fillRect(x, y, ((hp / 100) * width), height);
    }
}
