require(['jquery', 'nokia-map', 'util', 'ranking', 'handlers'], function ($, nokiaMap, util, rankingFuncs, handlers) {
    "use strict";

    var forceTileSize = 64;
    var width = 11;
    var height = 5;
    var canvasEnabled = $('#enableCanvas').attr('checked');
    var domEnabled = $('#enableDom').attr('checked');
    var tilesTotal, tilesLoaded, tiles;
    var tileType = 'satellite.day';
    var canvas = document.getElementById('mapCanvas');
    var ctx = canvas.getContext('2d');
    var scratchCanvas = $('<canvas></canvas>')[0];
    var scratchCtx = scratchCanvas.getContext('2d');

    var rankingFunc = rankingFuncs.calcAvgColor;

    var initTileDisplay = function () {
        $('#tiles').empty();

        if (domEnabled) {
            $('#tiles').width(width * forceTileSize);
            $('#tiles').height(height * forceTileSize);
            $('#tiles').show();
        }
        else {
            $('#tiles').hide();
        }

        if (canvasEnabled) {
            $('#mapCanvas')[0].width = (width * forceTileSize);
            $('#mapCanvas')[0].height = (height * forceTileSize);
            $('#mapCanvas').show();
        }
        else {
            $('#mapCanvas').hide();
        }
    };

    var renderTiles = function () {
        var x, y;

        tilesTotal = width * height;
        tilesLoaded = 0;
        tiles = [];

        if (! canvasEnabled && ! domEnabled) {
            return;
        }

        for (x = 0; x < width; ++x) {
            for (y = 0; y < height; ++y) {
                var tileUrl = nokiaMap.getTileUrl(15, 17640 + util.getRandomInt(-100, 100), 10755 + util.getRandomInt(-100, 100), tileType);
                var tile;

                tile = fetchTile(tileUrl);
                tiles.push(tile);
            }
        }

        waitForTilesRendered(function () {
            sortTilesByRanking();
            displayTiles();
        });
    };

    var displayTiles = function () {
        var i, x, y;

        for (i = 0; i < tiles.length; ++i) {
            y = Math.floor(i / width);
            x = i - y * width;

            if (canvasEnabled) {
                renderTileCanvas(tiles[i], forceTileSize, x, y);
            }

            if (domEnabled) {
                renderTileDom(tiles[i], forceTileSize);
            }
        }
    };

    var renderTileDom = function (tile, size) {
        $('#tiles').append(tile.image)
            .children().last().attr({
                width:size,
                height:size
            });
    };

    var renderTileCanvas = function (tile, tileSize, x, y) {
        var left = x * tileSize;
        var top = y * tileSize;

        ctx.drawImage(tile.image, left, top, tileSize, tileSize);
    };

    var fetchTile = function (url) {
        var tile = {};
        tile.image = new Image();

        tile.image.src = url;
        tile.image.onload = function () {
            calcTileRanking(tile);
        };
        tile.image.onerror = function () {
            tilesLoaded++;
            updateProgress(tilesLoaded, tilesTotal);
        };

        return tile;
    };

    var calcTileRanking = function (tile) {
        scratchCanvas.width = tile.image.width;
        scratchCanvas.height = tile.image.height;
        scratchCtx.drawImage(tile.image, 0, 0);

        var imageData = scratchCtx.getImageData(0, 0, tile.image.width, tile.image.height);
        tile.ranking = rankingFunc(imageData.data);

        tilesLoaded++;
        updateProgress(tilesLoaded, tilesTotal);
    };

    var waitForTilesRendered = function (callback) {
        var waitHandle = setInterval(function () {
            if (tilesLoaded === tilesTotal) {
                clearInterval(waitHandle);
                callback();
            }
        }, 100);
    };

    var sortTilesByRanking = function () {
        tiles.sort(function (a, b) {
            return a.ranking - b.ranking;
        });
    };

    var updateProgress = function (loaded, total) {
        $('progress')[0].value = loaded;
        $('progress')[0].max = total;
        $('#tiles-loaded').text(loaded);
        $('#tiles-total').text(total);
    };

    handlers.init();
    initTileDisplay();
    renderTiles();
});