class Players {
    constructor(scene) {
        this.scene = scene;

        this.group = scene.physics.add.group();
    };

    render (players, client) {
        // Remove any existing players on the screen
        this.group.clear(true, true);

        // Loop around each player and render them to the screen
        for (let id in players) {
            let player = players[id];

            let sprite = this.scene.physics.add.image(
                player.x,
                player.y,
                this.getTexture(player.avatar),
                (this.getFrame(player.facing) + player.frame)
            );
            sprite.setOrigin(0, 0);
            sprite.setData("username", player.id);

            // If we are rendering the current client then set the cameras to follow.
            if (client === id) {
                this.scene.cameras.main.startFollow(sprite);
            }

            this.group.add(sprite);

            // Temporary code for health
            let text = player.health + "/" + player.maxHealth;
            let health = this.scene.add.text(player.x, player.y - 5, text, {
                fontSize: "9px",
                fill: "#000"
            });
            this.group.add(health);

            // Temporary code for messages
            if (player.message.id && player.message.text) {
                let divExists = $("#" + player.message.id).length;
                if (!divExists) {
                    let messageDiv = $("<div>", {
                        "id"    :   player.message.id,
                        "class" :   "historicMessage"
                    }).text(player.id + ": " + player.message.text);
                    $("#messageHistory").append(messageDiv);
                }
            }
        }
    };

    getAtXY (x, y) {
        let players = [];

        let children = this.group.getChildren();
        for (var id in children) {
            var sprite = children[id];

            if (sprite.x != x || sprite.y != y) {
                continue;
            }

            players.push(sprite.getData("username"));
        }

        return players;
    };

    getFrame (facing) {
        let frame = null;
        switch (facing) {
            case "up":
                frame = 0;
                break;
            case "down":
                frame = 6;
                break;

            case "right":
                frame = 3;
                break;

            case "left":
                frame = 9;
                break;
        }
        return frame;
    };

    getTexture (avatar) {
        return "playerType_" + avatar;
    };
};
export default Players;
