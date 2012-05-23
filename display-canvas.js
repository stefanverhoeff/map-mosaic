define(['jquery'], function ($) {
    "use strict";

    var canvas = document.getElementById('mapCanvas');
    var ctx = canvas.getContext('2d');

    var init = function (tileColumns, tileRows, tileSize) {
        $('#mapCanvas')[0].width = (tileColumns * tileSize);
        $('#mapCanvas')[0].height = (tileRows * tileSize);
        $('#mapCanvas').show();
    };

    var hide = function () {
        $('#mapCanvas').hide();
    };

    var renderTile = function (tile, tileSize, row, column) {
        var left = column * tileSize;
        var top = row * tileSize;

        ctx.putImageData(tile.imageData, left, top);
    };

    return {
        init:init,
        hide:hide,
        renderTile:renderTile
    };
});
