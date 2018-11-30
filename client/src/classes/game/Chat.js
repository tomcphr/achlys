class Chat {
    constructor(scene, config) {
        this.scene = scene;

        this.config = config;

        this.create();
    };

    create() {
        let html = "<div id='messageContainer'>";
                html += "<div id='messageHistory'></div>";
                html += "<div id='currentMessage'>";
                    html += "<input type='text' name='message' id='messageText'>";
                    html += "<button id='sendMessage'>Send</button>";
                html += "</div>";
            html += "</div>";
        $("#ui-chat").append(html);

        $("#messageText").on("keyup", function (event) {
            event.preventDefault();
            if (event.keyCode === 13) {
                $("#sendMessage").click();
            }
        });

        let self = this;
        $("#sendMessage").click(function () {
            var message = $("#messageText").val();
            if (!message) {
                return;
            }

            self.config.socket.emit("message", message);

            $("#messageText").val("");
        });
    };
};
export default Chat;
