export class RenderEngine {
    ctx: CanvasRenderingContext2D;

    width: number;
    height: number;

    tiles: object = {
        0    :     null,
        1    :     null
    };

    readonly TILE_WIDTH: number = 32;
    readonly TILE_HEIGHT: number = 32;
    readonly SCALE_MODIFIER: number = 2;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;

        for (let index in this.tiles) {
            let image = new Image();
            image.src = "/img/tiles/" + index + ".png";
            this.tiles[index] = image;
        }
    };

    render(tiles: object, x: number, y: number) {
        for (let rowIndex in tiles) {
            tiles[rowIndex].forEach((tileId, columnIndex) => {
                this.ctx.drawImage(
                    this.tiles[String(tileId)],
                    0,
                    0,
                    this.TILE_WIDTH,
                    this.TILE_HEIGHT,
                    x - ((parseInt(columnIndex) * this.TILE_WIDTH) * this.SCALE_MODIFIER),
                    y - ((parseInt(rowIndex) * this.TILE_HEIGHT) * this.SCALE_MODIFIER),
                    this.TILE_WIDTH * this.SCALE_MODIFIER,
                    this.TILE_HEIGHT * this.SCALE_MODIFIER
                );
            });
        }
    };
}
