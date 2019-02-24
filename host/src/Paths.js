class Paths {
    constructor (world, user) {
        this.world = world;
        this.user = user;

        let pathFinding = require("pathfinding");
        this.gridFinder = new pathFinding.AStarFinder();
        this.matrix = new pathFinding.Grid(this.getTileMatrix());
    };

    getTileMatrix () {
        let tilemap = this.world.getTileMap();

        let matrix = [];
        for (var row = 0; row < tilemap.length; row++) {
            let data = [];
            for (var col = 0; col < tilemap[row].length; col++) {
                let tile = tilemap[row][col];

                let blocker = 0;
                if (tile == 0) {
                    blocker = 1;
                }

                data.push(blocker);
            }
            matrix.push(data);
        };

        return matrix;
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
