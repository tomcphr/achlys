class Paths {
    constructor (world) {
        this.world = world;
    };

    getTileMatrix () {
        let matrix = {};
        this.loopTilemap((data) =>  {
            if (!(data.row in matrix)) {
                matrix[data.row] = {};
            }

            matrix[data.row][data.column] = data.unavailable;
        });

        var dataMatrix = [];
        for (var row in matrix) {
            var matrixRow = [];
            for (var column in matrix[row]) {
                matrixRow.push(matrix[row][column]);
            }
            dataMatrix.push(matrixRow);
        }

        return dataMatrix;
    };

    getRandomXY () {
        let positions = [];

        this.loopTilemap((data) =>  {
            if (data.unavailable) {
                return;
            }

            positions.push({
                "x" :   data.column * 32,
                "y" :   data.row * 32
            });
        });

        return positions[positions.length * Math.random() | 0];
    }

    loopTilemap (callback) {
        let tilemap = this.world.getTileMap();

        for (var row = 0; row < tilemap.length; row++) {
            for (var col = 0; col < tilemap[row].length; col++) {
                let tile = tilemap[row][col];

                let unavailable = 0;
                if (tile == 0) {
                    unavailable = 1;
                }

                callback({
                    "row"           :   row,
                    "column"        :   col,
                    "unavailable"   :   unavailable,
                });
            }
        }
    };
}
module.exports = Paths;
