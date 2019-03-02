class Chat {
    constructor(scene, config) {
        this.scene = scene;

        this.config = config;

        this.create();
    };

    create() {
        let html = "<div id='messageContainer' class='hidden'>";
                html += "<div id='messageHistory'></div>";
                html += "<div id='currentMessage'>";
                    html += "<input type='text' name='message' id='messageText'>";
                    html += "<button id='sendMessage'>Send</button>";
                html += "</div>";
            html += "</div>";
        $("#ui-chat").append(html);

        $("#messageText").off("keyup");
        $("#messageText").on("keyup", function (event) {
            event.preventDefault();
            if (event.keyCode === 13) {
                $("#sendMessage").click();
            }
        });

        let self = this;
        $("#sendMessage").off("click");
        $("#sendMessage").on("click", function () {
            var message = $("#messageText").val();
            if (!message) {
                return;
            }

            self.config.socket.emit("message", message);

            $("#messageText").val("");
        });
        let chatButton = "<img id='chatButton' class='menuButton' src='gui/chat-button.png'></img>";
        $("#ui-chat").append(chatButton);
        $("#chatButton").off("click");
        $("#chatButton").on("click", () =>  {
            let visible = $("#messageContainer").is(":visible");
            if (visible) {
                $("#messageContainer").hide();
                return;
            }
            $("#messageContainer").show();
        });
    };
};
export default Chat;
