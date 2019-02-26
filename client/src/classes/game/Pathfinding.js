class Pathfinding {
    constructor(scene, matrix) {
        this.scene = scene;

        let pathFinding = require("pathfinding");
        this.matrix = new pathFinding.Grid(matrix);

        this.finder = new pathFinding.AStarFinder();
    };

    findPath(fromX, fromY, toX, toY)
    {
        let path = this.finder.findPath(
            Math.floor(fromX / 32),
            Math.floor(fromY / 32),
            Math.floor(toX / 32),
            Math.floor(toY / 32),
            this.matrix
        );
        let xyPath = [];
        if (path) {
            for (var i = 0; i < path.length; i++) {
                let stepX = Math.ceil(path[i][0] * 32);
                let stepY = Math.ceil(path[i][1] * 32);

                if (stepX === fromX && stepY === fromY) {
                    continue;
                }

                xyPath.push({
                    "x"     :   stepX,
                    "y"     :   stepY
                });
            }
        }
        return xyPath;
    };
};
export default Pathfinding;
