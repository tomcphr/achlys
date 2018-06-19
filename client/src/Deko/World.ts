export class World
{
    socket: SocketIOClient.Socket;
    ctx: CanvasRenderingContext2D;
    
    images: object = {};
    playerWidth: number = 24;
    playerHeight: number = 32;
    playerMultiplier: number = 3;
    
    constructor (socket: SocketIOClient.Socket, ctx: CanvasRenderingContext2D)
    {
        this.socket = socket;
        
        this.ctx = ctx;
        
        var avatars = [
            "M",
            "F",
        ];
        for (var i = 0; i < avatars.length; i++) {
            var avatar = avatars[i];

            var image = new Image();
            image.src = "/img/player_" + avatar + ".png";

            this.images[avatar] = image;
        }
    }
    
    drawPlayer (x: number, y: number, avatar: string, facing: string, frame: number)
    {
        var width = this.playerWidth;
        var height = this.playerHeight;
        var multiplier = this.playerMultiplier;
        
        switch (facing) {
            case "up":
                var imageY = 0;
                break;
    
            case "right":
                var imageY = height;
                break;
    
            case "down":
                var imageY = height * 2;
                break;
    
            case "left":
                var imageY = height * 3;
                break;
        }
    
        this.ctx.drawImage(
            this.images[avatar],
            width * frame,
            imageY,
            width,
            height,
            x,
            y,
            width * multiplier,
            height * multiplier,
        );
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
