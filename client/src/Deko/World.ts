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
