class ContextMenu {
    constructor(scene, socket) {
        this.scene = scene;

        this.socket = socket;

        if ($("#contextMenu").length) {
            $("#contextMenu").remove();
        }
        var html = "<ul id='contextMenu'></ul>";
        $("#gameContainer").append(html);
    };

    addOptions (key, options) {
        var html = "<li class='menuOption'>";
            html += "<div>" + key + "</div>";
            if (Object.keys(options).length) {
                html += "<ul>";
                    for (var option in options) {
                        var title = options[option];
                        html += "<li key='" + key + "' option='" + option + "'><div>" + title + "</div></li>";
                    }
                html += "</ul>";
            }
            html += "</li>";
        $("#contextMenu").append(html);
    };

    render (x, y) {
        if (!$(".menuOption").length) {
            return;
        }

        $("#contextMenu").css("top", y + "px");
        $("#contextMenu").css("left", x + "px");

        var socket = this.socket;
        $("#contextMenu").menu({
            select: function (event, ui) {
                var key = ui.item.attr("key");
                if (!key) {
                    return;
                }
                var option = ui.item.attr("option");
                socket.emit("menu", {
                    "key"       :   key,
                    "option"    :   option
                });
                $("#contextMenu").remove();
            }
        });
        $("#gameContainer").not($("#contextMenu")).on("click", ()    =>   {
            $("#contextMenu").remove();
        });
    };
};
export default ContextMenu;
