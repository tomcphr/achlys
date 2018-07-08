export class WorldObject
{
    private ctx: CanvasRenderingContext2D;

    private image;
    private width: number;
    private height: number;
    private scale: number;

    constructor (private c: CanvasRenderingContext2D, private i, private w: number, private h: number)
    {
        this.ctx = c;
        this.image = i;
        this.width = w;
        this.height = h;
        this.scale = 1;
    };

    getWidth ()
    {
        return this.width;
    }

    getHeight ()
    {
        return this.height;
    }

    getScale ()
    {
        return this.scale;
    }

    scaleBy (scale: number)
    {
        this.scale = scale;
    };

    draw (positionX: number, positionY: number, imageX: number, imageY: number)
    {
        var scaledWidth = this.width * this.scale;
        var scaledHeight = this.height * this.scale;

        this.ctx.drawImage(
            this.image,
            imageX,
            imageY,
            this.width,
            this.height,
            positionX,
            positionY,
            scaledWidth,
            scaledHeight,
        );
    };
}
