import {User} from "./User";

$(function () {
    var socket = io();

    var user = new User(socket);

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
});
