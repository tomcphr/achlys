import {User} from "./User";

$(function () {
    var socket = io();

    var user = new User(socket);

    $(document).on("change", "#avatarSelect", function () {
        var value = $(this).val();

        var src = "/img/register/" + value + ".png";

        $("#avatarImage").attr("src", src);
    });

    $("#ctx").bind("contextmenu", function (e) {
        return false;
    });

    $("#messageText").on("keyup", function (event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            $("#sendMessage").click();
        }
    });
    $("#sendMessage").click(function () {
        var message = $("#messageText").val();
        if (!message) {
            return;
        }

        socket.emit("message", message);

        $("#messageText").val("");
    });
});
