class World {
    constructor(scene) {
        this.scene = scene;

        this.setupJson(null);
    };

    render (json) {
        let tilemap = this.getTileMap(json);
        this.layer = tilemap.createStaticLayer(0, tilemap.addTilesetImage("tiles"), 0, 0);
        this.setupJson(json);
        this.marker = this.createMarker();
    };

    getJson () {
        return this.json;
    };

    getLayer () {
        return this.layer;
    };

    getMarker () {
        return this.marker;
    };

    createMarker () {
        let marker = this.scene.add.graphics();
        marker.lineStyle(5, 0xffffff, 1);
        marker.strokeRect(0, 0, 32, 32);
        marker.lineStyle(3, 0xff4f78, 1);
        marker.strokeRect(0, 0, 32, 32);
        return marker;
    };

    getTileMap (json) {
        return this.scene.make.tilemap({
            data: json,
            tileWidth: 32,
            tileHeight: 32
        })
    };

    setupJson (json) {
        this.json = json;
    };
};
export default World;
