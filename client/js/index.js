var canvas = document.getElementById("ctx");
var ctx = canvas.getContext("2d");
ctx.font = "16px Verdana";
ctx.textAlign = "center";

var socket = io();

var playerImage = new Image();
playerImage.src = "/img/player.png";
var playerWidth = 24;
var playerHeight = 32;

var username = null;
getHtml("/login", function (data) {
    var login = {
        "login" :   {
            title: "Login",
            html: data.documentElement.innerHTML,
        	buttons: {Login: 1},
        	submit: function(event, value, m, form) {
        	    event.preventDefault();
        	    
        		username = form.username;
                
        		socket.emit("validate", form, function (valid) {
        		    if (valid) {
        		        $.prompt.close();
        		        socket.emit("adduser", username);
        		        runGame();
        		        return;
        		    }
        		    $.prompt.goToState("error", true);
                });
        	}
        },
        "error" :   {
            html: "Invalid username or password provided",
            buttons: {Ok: 1},
            submit: function(event) {
                event.preventDefault();
                $.prompt.goToState("login");
            }
        }
    };
    $.prompt(login);
});

function runGame () {
    socket.on("positions", function (data) {
        ctx.clearRect(0, 0, $("#ctx").attr("width"), $("#ctx").attr("height"));
        for (var i = 0; i < data.length; i++) {
            // Don't show the players own username above their character
            if (data[i].id !== username) {
                ctx.fillText(data[i].id, data[i].x + ((playerWidth * 3) / 2), data[i].y);
            }
            drawPlayer(
                data[i].facing,
                data[i].frame,
                data[i].x,
                data[i].y
            );
            ctx.rect(data[i].x,data[i].y,playerWidth * 3,playerHeight * 3);
            ctx.stroke();
        }
    });
}


/**
 * Get HTML asynchronously
 * @param  {String}   url      The URL to get HTML from
 * @param  {Function} callback A callback funtion. Pass in "response" variable to use returned HTML.
 */
function getHtml (url, callback) {

	// Feature detection
	if ( !window.XMLHttpRequest ) return;

	// Create new request
	var xhr = new XMLHttpRequest();

	// Setup callback
	xhr.onload = function() {
		if ( callback && typeof( callback ) === 'function' ) {
			callback( this.responseXML );
		}
	}

	// Get the HTML
	xhr.open( 'GET', url );
	xhr.responseType = 'document';
	xhr.send();
};

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
            var imageY = playerHeight;
            break;

        case "down":
            var imageY = playerHeight * 2;
            break;

        case "left":
            var imageY = playerHeight * 3;
            break;
    }

    ctx.drawImage(
        playerImage,
        playerWidth * frame,
        imageY,
        playerWidth,
        playerHeight,
        x,
        y,
        playerWidth * 3,
        playerHeight * 3
    );
}
