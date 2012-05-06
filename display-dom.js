define(['jquery'], function ($) {
    "use strict";

    var canvas = document.getElementById('mapCanvas');
    var ctx = canvas.getContext('2d');

    var init = function (width, height, tileSize) {
        $('#tiles').empty();
        $('#tiles').width(width * tileSize);
        $('#tiles').height(height * tileSize);
        $('#tiles').show();
    };

    var hide = function () {
        $('#tiles').hide();
    };

    var renderTile = function (tile, tileSize, x, y) {
        $('#tiles').append(tile.image)
            .children().last().attr({
                width:tileSize,
                height:tileSize
            });
    };

    return {
        init:init,
        hide:hide,
        renderTile:renderTile
    };
});