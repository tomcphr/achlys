class Paths {
    constructor (world, user) {
        this.world = world;
        this.user = user;

        let pathFinding = require("pathfinding");
        this.gridFinder = new pathFinding.AStarFinder();
        this.matrix = new pathFinding.Grid(this.getTileMatrix());
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

    follow (username) {
        let session = this.world.getUserSession(username);
        if (!session) {
            return false;
        }

        let victim = session.user;

        let path = this.find(victim.x, victim.y);

        // If the user is over a certain distance then don't follow.
        if (path.length > 15) {
            return false;
        }

        // Remove the last step of the path as we don't want the user to be above the victim.
        path.pop();

        this.user.path = path;

        return true;
    };

    redirect (x, y) {
        this.user.path = this.find(x, y);
    };

    distance (x, y) {
        let path = this.find(x, y);
        return path.length;
    };

    find (x, y) {
        let currentTileX = Math.floor(this.user.x / 32);
        let currentTileY = Math.floor(this.user.y / 32);

        let targetTileX = Math.floor(x / 32);
        let targetTileY = Math.floor(y / 32);

        let path = this.gridFinder.findPath(
            currentTileX,
            currentTileY,
            targetTileX,
            targetTileY,
            this.matrix
        );
        if (path) {
            let xyPath = [];
            for (var i = 0; i < path.length; i++) {
                let stepX = Math.ceil(path[i][0] * 32);
                let stepY = Math.ceil(path[i][1] * 32);

                if (stepX === this.user.x && stepY === this.user.y) {
                    continue;
                }

                xyPath.push({
                    "x" :   stepX,
                    "y" :   stepY
                });
            }
            return xyPath;
        }

        return [];
    };
}
module.exports = Paths;
