class Tiles {
    constructor () {
        this.width = 32;

        this.height = 32;

        this.maps = {
            "overworld" :   require("../maps/overworld.json")
        };
    };

    getWidth () {
        return this.width;
    };

    getHeight () {
        return this.height;
    };

    getMap (type) {
        return this.maps[type];
    };
}
module.exports = Tiles;
