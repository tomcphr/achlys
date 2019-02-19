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

        // Handle the display of the world
        let players = this.physics.add.group();
        let items = this.physics.add.group();

        this.world = {
            data: null,
            tilemap: null,
            layer: null,
            marker: null
        };

        config.socket.on("details", ((data) =>  {
            let logged = data.logged;
            if (!logged) {
                return;
            }

            let currentPlayer = data.players[logged];
            if (!currentPlayer.loaded) {
                return;
            }

            if (JSON.stringify(data.world) !== JSON.stringify(this.world.data)) {
                let tilemap = this.make.tilemap({
                    data: data.world,
                    tileWidth: 32,
                    tileHeight: 32
                });
                let layer = tilemap.createStaticLayer(0, tilemap.addTilesetImage("tiles"), 0, 0);

                this.world.data = data.world;
                this.world.tilemap = tilemap;
                this.world.layer = layer;

                // Setup a marker, so we can represent the cursor in the world
                this.world.marker = this.add.graphics();
                this.world.marker.lineStyle(5, 0xffffff, 1);
                this.world.marker.strokeRect(0, 0, 32, 32);
                this.world.marker.lineStyle(3, 0xff4f78, 1);
                this.world.marker.strokeRect(0, 0, 32, 32);
            }

            this.players(this, players, data.players, data.logged);

            this.items(this, items, data.items);
        }).bind(this));

        this.input.on("pointerdown", (pointer)   =>  {
            let type = "left";
            if (pointer.rightButtonDown()) {
                type = "right";
            }

            this.socket.emit("click", {
                "type"  :   type,
                "x"     :   this.world.marker.x,
                "y"     :   this.world.marker.y
            });
        }, this);

        // Set the camera to zoom
        this.cameras.main.setZoom(1.5);
    }


    update ()
    {
        // Convert the mouse position to world position within the camera
        const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
        if (this.world.data != null) {
            // Place the marker in world space, but snap it to the tile grid. If we convert world -> tile and
            // then tile -> world, we end up with the position of the tile under the pointer
            const pointerTileXY = this.world.layer.worldToTileXY(worldPoint.x, worldPoint.y);
            const snappedWorldPoint = this.world.layer.tileToWorldXY(pointerTileXY.x, pointerTileXY.y);
            this.world.marker.setPosition(snappedWorldPoint.x, snappedWorldPoint.y);
        }
    }

    players (scene, group, data, logged)
    {
        group.clear(true, true);

        for (let id in data) {
            let player = data[id];

            let image = "playerType_" + player.avatar;

            let startFrame = null;

            switch (player.facing) {
                case "up":
                    startFrame = 0;
                    break;
                case "down":
                    startFrame = 6;
                    break;

                case "right":
                    startFrame = 3;
                    break;

                case "left":
                    startFrame = 9;
                    break;
            }

            let sprite = scene.physics.add.image(
                player.x,
                player.y,
                image,
                (startFrame + player.frame)
            );
            sprite.setOrigin(0, 0);

            if (logged === id) {
                scene.cameras.main.startFollow(sprite);
            }

            group.add(sprite);

            // Handle for any messages that the user may have associated with them
            if (player.message.id && player.message.text) {
                let divExists = $("#" + player.message.id).length;
                if (!divExists) {
                    let messageDiv = $("<div>", {
                        "id"    :   player.message.id,
                        "class" :   "historicMessage"
                    }).html(player.id + ": " + player.message.text);
                    $("#messageHistory").append(messageDiv);
                }
            }
        }
    }


    items (scene, group, data)
    {
        group.clear(true, true);

        for (let id in data) {
            let item = data[id];

            let sprite = scene.physics.add.image(
                item.x,
                item.y,
                "items",
                (item.id - 1),
            );
            sprite.setOrigin(0, 0);

            group.add(sprite);
        }
    }
}

export default Overworld;
