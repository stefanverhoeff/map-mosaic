require(['jquery', 'nokia-map', 'util', 'ranking', 'handlers', 'display-canvas', 'display-dom'], function ($, nokiaMap, util, rankingFuncs, handlers, displayCanvas, displayDom) {
    "use strict";

    var sourceTileSize = 128;
    var targetTileSize = 64;
    var width = 11;
    var height = 5;
    var canvasEnabled = $('#enableCanvas').attr('checked');
    var domEnabled = $('#enableDom').attr('checked');
    var tilesTotal;
    var tilesLoaded;
    var tiles;
    var tileType = 'satellite.day';
    var scratchCanvas = $('<canvas></canvas>')[0];
    var scratchCtx = scratchCanvas.getContext('2d');

    var rankingFunc = rankingFuncs.calcAvgColor;

    var initTileDisplay = function () {
        if (domEnabled) {
            displayDom.init(width, height, targetTileSize);
        }
        else {
            displayDom.hide();
        }

        if (canvasEnabled) {
            displayCanvas.init(width, height, targetTileSize);
        }
        else {
            displayCanvas.hide();
        }
    };

    var renderTiles = function () {
        var x, y;

        tilesTotal = width * height;
        tilesLoaded = 0;
        tiles = [];

        if (!canvasEnabled && !domEnabled) {
            return;
        }

        for (x = 0; x < width; ++x) {
            for (y = 0; y < height; ++y) {
                var tileUrl = nokiaMap.getTileUrl(15, 17640 + util.getRandomInt(-100, 100), 10755 + util.getRandomInt(-100, 100), sourceTileSize, tileType);
                var tile = fetchTile(tileUrl);
                tiles.push(tile);
            }
        }

        waitForTilesRendered(function () {
            calcTilesRankingAndDisplay();
        });
    };

    var displayTiles = function () {
        var i, x, y;

        for (i = 0; i < tiles.length; ++i) {
            y = Math.floor(i / width);
            x = i - y * width;

            if (canvasEnabled) {
                displayCanvas.renderTile(tiles[i], targetTileSize, x, y);
            }

            if (domEnabled) {
                displayDom.renderTile(tiles[i], targetTileSize, x, y);
            }
        }
    };

    var fetchTile = function (url) {
        var tile = {};
        tile.image = new Image();

        tile.image.src = url;
        tile.image.onload = function () {
            increaseProgress();
        };
        tile.image.onerror = function () {
            increaseProgress();
        };

        return tile;
    };

    var calcTilesRankingAndDisplay = function () {
        resetProgress();
        for (var i = 0; i < tiles.length; ++i) {
            var tile = tiles[i];
            // A-sync so progress update can be seen
            (function (theTile) {
                setTimeout(function () {
                    theTile.ranking = calcTileRanking(theTile);
                    increaseProgress();

                    if (tilesLoaded === tilesTotal) {
                        sortTilesByRanking();
                        displayTiles();
                    }
                }, 10);
            })(tile);
        }
    };

    var calcTileRanking = function (tile) {
        scratchCanvas.width = tile.image.width;
        scratchCanvas.height = tile.image.height;
        scratchCtx.drawImage(tile.image, 0, 0);

        var imageData = scratchCtx.getImageData(0, 0, tile.image.width, tile.image.height);
        return rankingFunc(imageData.data);
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

    var resetProgress = function () {
        tilesLoaded = 0;
        updateProgress(tilesLoaded, tilesTotal);
    };

    var increaseProgress = function () {
        tilesLoaded++;
        updateProgress(tilesLoaded, tilesTotal);
    };

    var updateProgress = function (loaded, total) {
        $('progress')[0].value = loaded;
        $('progress')[0].max = total;
        $('#tiles-loaded').text(loaded);
        $('#tiles-total').text(total);
    };

    handlers.init({
        setCanvasEnabled:function (enabled) {
            canvasEnabled = enabled;
        },
        setDomEnabled:function (enabled) {
            domEnabled = enabled;
        },
        setRankingFunc:function (rankingFuncName) {
            rankingFunc = rankingFuncs[rankingFuncName];
        },
        setTileType:function (type) {
            tileType = type;
        },
        initTileDisplay:initTileDisplay,
        displayTiles:displayTiles,
        calcTileRanking:calcTileRanking,
        sortTilesByRanking:sortTilesByRanking,
        renderTiles:renderTiles,
        calcTilesRanking:calcTilesRankingAndDisplay
    });
    initTileDisplay();
    renderTiles();
});