var canvas = document.getElementById("ctx");
var ctx = canvas.getContext("2d");
ctx.font = "15px Verdana";
ctx.textAlign = "center";

var socket = io();

var username = prompt('What\'s your username?');
while (!username) {
    username = prompt('What\'s your username?');
};
socket.emit('adduser', username);

var playerImage = new Image();
playerImage.src = "/img/player.png";

socket.on("positions", function (data) {
    ctx.clearRect(0, 0, 480, 320);
    for (var i = 0; i < data.length; i++) {
        ctx.fillText(data[i].id, data[i].x + 23, data[i].y);
        drawPlayer(
            data[i].facing,
            data[i].frame,
            data[i].x,
            data[i].y
        );
    }
});

document.onkeydown = function (event) {
    var type = keyPress(event.keyCode);
    socket.emit("keyPress", {
        "type"  :   type,
        "state" :   true,
    });
}

document.onkeyup = function (event) {
    var type = keyPress(event.keyCode);
    socket.emit("keyPress", {
        "type"  :   type,
        "state" :   false,
    });
}

function keyPress (key) {
    switch (key) {
        case 68:
        case 39:
            return "right";

        case 83:
        case 40:
            return "down";

        case 65:
        case 37:
            return "left";

        case 87:
        case 38:
            return "up";

        default:
            return 0;
    }
}

function drawPlayer (direction, frame, x, y) {
    switch (direction) {
        case "up":
            var imageY = 0;
            break;

        case "right":
            var imageY = 32;
            break;

        case "down":
            var imageY = 64;
            break;

        case "left":
            var imageY = 96;
            break;
    }

    var width = 24;
    var height = 32;

    ctx.drawImage(
        playerImage,
        24 * frame,
        imageY,
        width,
        height,
        x,
        y,
        width * 2,
        height * 2
    );
}
