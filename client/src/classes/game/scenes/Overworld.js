import ContextMenu from "../ContextMenu";
import Items from "../Items";
import Pathfinding from "../Pathfinding";
import Players from "../Players";
import World from "../World";

class Overworld extends Phaser.Scene {
    constructor () {
        super({
            "active": true
        });
    }

    preload () {
        let params = {
            frameWidth: 32,
            frameHeight: 32
        };
        this.load.spritesheet("playerType_M", "tilesets/players/M.png", params);
        this.load.spritesheet("playerType_F", "tilesets/players/F.png", params);
        this.load.spritesheet("tiles", "tilesets/tiles.png", params);
        this.load.spritesheet("items", "tilesets/items.png", params);
    }

    create (config)
    {
        this.input.mouse.disableContextMenu();

        this.socket = config.socket;

        this.world = new World(this);

        this.players = new Players(this);

        this.items = new Items(this);

        this.cameras.main.setZoom(1);

        this.socket.on("gameTick", ((data) =>  {
            // Don't render anything if we haven't logged in yet
            let logged = data.logged;
            if (!logged) {
                return;
            }

            // Don't try to render anything if the current player hasn't fully logged in.
            let currentPlayer = data.players[logged];
            if (!currentPlayer.loaded) {
                return;
            }

            let pathfinding = new Pathfinding(this, data.worldMatrix);

            this.renderTick(data, currentPlayer, pathfinding);

            // If the current player is following someone; then find the path and follow.
            var currentFollow = currentPlayer.following;
            if (currentFollow) {
                if (currentFollow in data.players) {
                    let victim = data.players[currentFollow];

                    let newPath = pathfinding.findPath(currentPlayer.x, currentPlayer.y, victim.x, victim.y);
                    if (newPath) {
                        // Remove the last step of the path as we don't want the user to be above the victim.
                        newPath.pop();

                        this.socket.emit("follow", newPath);
                    }
                }
            }
        }).bind(this));
    }


    update ()
    {
        // Convert the mouse position to world position within the camera
        const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
        if (this.world.getJson()) {
            // Place the marker in world space, but snap it to the tile grid. If we convert world -> tile and
            // then tile -> world, we end up with the position of the tile under the pointer
            const pointerTileXY = this.world.getLayer().worldToTileXY(worldPoint.x, worldPoint.y);
            const snappedWorldPoint = this.world.getLayer().tileToWorldXY(pointerTileXY.x, pointerTileXY.y);
            this.world.getMarker().setPosition(snappedWorldPoint.x, snappedWorldPoint.y);
        }
    }

    renderTick (data, currentPlayer, pathfinding)
    {
        // Render the world
        let currentJson = JSON.stringify(this.world.getJson());
        let newJson = JSON.stringify(data.worldMap);
        if (currentJson !== newJson) {
            this.world.render(data.worldMap);
        }

        // clicking.
        this.input.off("pointerdown");
        this.input.on("pointerdown", (pointer)   =>  {
            $("#contextMenu").remove();
            if (pointer.rightButtonDown()) {
                let contextMenu = new ContextMenu(this.scene, this.socket);

                let marker = this.world.getMarker();

                let players = this.players.getAtXY(marker.x, marker.y);
                for (var id in players) {
                    var username = players[id];

                    // Don't allow the current player to select themselves
                    if (username === currentPlayer.id) {
                        continue;
                    }

                    contextMenu.addOptions(username, {
                        "attack"    :   "Attack",
                        "trade"     :   "Trade",
                        "follow"    :   "Follow"
                    });
                }

                var clientX = pointer.event.clientX;
                var clientY = pointer.event.clientY;
                contextMenu.render(clientX, clientY);

                return;
            }

            let newPath = pathfinding.findPath(currentPlayer.x, currentPlayer.y, this.world.marker.x, this.world.marker.y);

            this.socket.emit("click", newPath);
        }, this);

        // Generate players
        this.players.render(data.players, currentPlayer.id);

        // Generate items
        this.items.render(data.items);
    }
}

export default Overworld;
