var canvas = document.getElementById("ctx");
var ctx = canvas.getContext("2d");
ctx.font = "16px Verdana";
ctx.textAlign = "center";

var socket = io();

var genders = [
    "M",
    "F",
];
var playerImages = {};
for (var i = 0; i < genders.length; i++) {
    var gender = genders[i];

    var image = new Image();
    image.src = "/img/player_" + gender + ".png";
    
    playerImages[gender] = image; 
}

var playerWidth = 24;
var playerHeight = 32;

var username = null;
getHtml("/login", function (loginHtml) {
    getHtml("/register", function (registerHtml) {
        var login = {
            "login"     :   {
                title: "Login",
                html: loginHtml.documentElement.innerHTML,
            	buttons: {"Login": "login", "Register": "register", "Forgot?": "forgot"},
            	submit: function(event, value, message, form) {
            	    event.preventDefault();

            	    if (value == "register") {
            	        $.prompt.goToState("register");
            	    } else if (value == "login") {
                		validateUser({
                		    username: form.loginUsername,
                		    password: form.loginPassword
                		});
            	    }
            	}
            },
            "register"  :   {
                title: "Register",
                html: registerHtml.documentElement.innerHTML,
                buttons: {"Back": "back", "Create": "create"},
                submit: function (event, value, message, form) {
                    event.preventDefault();
                    
                    if (value === "back") {
                        $.prompt.goToState("login");
                    } else if (value === "create") {
                        socket.emit("create", {
                            email: form.registerEmail,
                            username: form.registerUsername,
                            password: form.registerPassword,
                            gender: form.registerGender
                        }, function (success, message) {
                            if (success) {
                                validateUser({
                                    username: form.registerUsername,
                                    password: form.registerPassword
                                });
                            } else if (message) {
                                callPromptError(message, "register");
                            }
                        });
                    }
                }
            },
        };
        $.prompt(login);
    });
});

function validateUser (form) {
    socket.emit("validate", form, function (valid) {
	    if (valid) {
	        $.prompt.close();
	        runGame(form.username);
	        return;
	    }
	    callPromptError("Invalid username or password", "login");
    });
}

function callPromptError (message, returnState) {
    $.prompt.removeState("error");
    jQuery.prompt.addState("error", {
        html: message,
        buttons: {Ok: "errorOk"},
        submit: function (event) {
            event.preventDefault();
            
            $.prompt.prevState();
        }
    }, returnState);
    $.prompt.goToState("error", true);
}

function runGame (username) {
    socket.emit("runGame", username);
    
    socket.on("details", function (data) {
        ctx.clearRect(0, 0, $("#ctx").attr("width"), $("#ctx").attr("height"));
        for (var i = 0; i < data.length; i++) {
            var playerCenterX = data[i].x + ((playerWidth * 3) / 2);
            
            var currentY = data[i].y - 10;
            if (data[i].hp) {
                var barWidth = (data[i].hp / 100) * 50;
                var barX = playerCenterX - (barWidth / 2);
                var barHeight = 7;
                
                ctx.fillStyle = "#000000";
                ctx.fillRect(barX - 1, currentY - 1, barWidth + 2, barHeight + 2);
                
                ctx.fillStyle = "#FF0000";
                ctx.fillRect(barX, currentY, barWidth, barHeight);
                
                currentY -= 15;
            }
            
            if (data[i].message) {
                ctx.fillStyle = "#000000";
                ctx.fillText(data[i].message, playerCenterX, currentY);
            }

            drawPlayer(
                data[i].gender,
                data[i].facing,
                data[i].frame,
                data[i].x,
                data[i].y
            );
        }
    });
}


/**
 * Get HTML asynchronously
 * @param  {String}   url      The URL to get HTML from
 * @param  {Function} callback A callback funtion. Pass in "response" variable to use returned HTML.
 */
function getHtml(url, callback) {

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

$("#messageText").on("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        $("#sendMessage").click();
    }
});

$("#sendMessage").click(function () {
    var message = $("#messageText").val();
    
    socket.emit("message", message);  
    
    $("#messageText").val("");
});

canvas.onkeydown = function (event) {
    var type = keyPress(event.keyCode);
    socket.emit("keyPress", {
        "type"  :   type,
        "state" :   true,
    });
}

canvas.onkeyup = function (event) {
    var type = keyPress(event.keyCode);
    socket.emit("keyPress", {
        "type"  :   type,
        "state" :   false,
    });
}

$("#ctx").focusout(function () {
    socket.emit("nofocus");
});

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

function drawPlayer (gender, direction, frame, x, y) {
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
        playerImages[gender],
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
