define(['jquery'], function ($) {
    "use strict";

    var canvas = document.getElementById('mapCanvas');
    var ctx = canvas.getContext('2d');

    var init = function (width, height, tileSize) {
        $('#mapCanvas')[0].width = (width * tileSize);
        $('#mapCanvas')[0].height = (height * tileSize);
        $('#mapCanvas').show();
    };

    var hide = function () {
        $('#mapCanvas').hide();

    };

    var renderTile = function (tile, tileSize, x, y) {
        var left = x * tileSize;
        var top = y * tileSize;

        ctx.drawImage(tile.image, left, top, tileSize, tileSize);
    };

    return {
        init:init,
        hide:hide,
        renderTile:renderTile
    };
});