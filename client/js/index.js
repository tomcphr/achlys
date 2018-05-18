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
                            password: form.registerPassword
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
            "error"     :   {
                buttons: {Ok: "errorOk"},
                submit: function (event) {
                    event.preventDefault();
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
    $.prompt.goToState("error", true, function () {
        var currentState = $.prompt.getCurrentState();
        currentState.find(".jqimessage").html(message);
        
        currentState.find(".jqibutton").click(function (event) {
            $.prompt.goToState(returnState);
            
            currentState.find(".jqimessage").html("");
        });
    });
}

function runGame (username) {
    socket.emit("runGame", username);
    
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
