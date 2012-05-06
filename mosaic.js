require(['jquery', 'nokia-map', 'util', 'ranking', 'handlers', 'display-canvas', 'display-dom'], function ($, nokiaMap, util, rankingFuncs, handlers, displayCanvas, displayDom) {
    "use strict";

    // 128 or 256
    var sourceTileSize = 128;
    // Must be divide-able by source size
    var targetTileSize = 32;
    var tilesPerSourceTile = sourceTileSize / targetTileSize;
    var width = 16;
    var height = 16;
    var canvasEnabled = $('#enableCanvas').attr('checked');
    var domEnabled = $('#enableDom').attr('checked');
    var tilesTotal;
    var tilesLoaded;
    var tiles;
    var tileType = 'satellite.day';
    var scratchCanvas = $('<canvas></canvas>').appendTo('#scratch')[0];
    var scratchCtx = scratchCanvas.getContext('2d');
    var sourceImageTiles;

    var rankingFunc = rankingFuncs.calcAvgColor;

    var readSourceImageData = function () {
        var sourceImage;
        var x, y;

        sourceImageTiles = [];
        sourceImage = $('#sourceImage')[0];

        scratchCanvas.width = sourceImage.width;
        scratchCanvas.height = sourceImage.height;
        scratchCtx.drawImage(sourceImage, 0, 0);

        tilesLoaded = 0;
        tilesTotal = (sourceImage.width / targetTileSize) * (sourceImage.height / targetTileSize);
        resetProgress();
        // TODO: fix sorting randomness
        for (x = 0; x * targetTileSize < sourceImage.width; ++x) {
            for (y = 0; y * targetTileSize < sourceImage.height; ++y) {
                (function (x, y) {
                    setTimeout(function () {
                        var imageTile = {};

                        imageTile.x = x * targetTileSize;
                        imageTile.y = y * targetTileSize;
                        imageTile.imageData = scratchCtx.getImageData(x * targetTileSize, y * targetTileSize, targetTileSize, targetTileSize);

                        sourceImageTiles.push(imageTile);
                        increaseProgress();
                    }, 10);
                })(x, y);
            }
        }

        tiles = sourceImageTiles;
        waitForTilesRendered(function () {
            calcTilesRankingAndDisplay();
        });
    };

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

        for (x = 0; x < Math.floor(width / tilesPerSourceTile); ++x) {
            for (y = 0; y < Math.floor(height / tilesPerSourceTile); ++y) {
                var tileUrl = nokiaMap.getTileUrl(15, 17640 + util.getRandomInt(-100, 100), 10755 + util.getRandomInt(-100, 100), sourceTileSize, tileType);
                fetchTileAndSplit(tileUrl);
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

    var fetchTileAndSplit = function (url) {
        var sourceImage;
        var x, y;

        sourceImage = new Image();

        sourceImage.src = url;
        sourceImage.onload = function () {
            scratchCanvas.width = sourceTileSize;
            scratchCanvas.height = sourceTileSize;
            scratchCtx.drawImage(sourceImage, 0, 0);

            for (x = 0; x * targetTileSize < sourceTileSize; ++x) {
                for (y = 0; y * targetTileSize < sourceTileSize; ++y) {
                    var targetTile = {};

                    targetTile.imageData = scratchCtx.getImageData(x * targetTileSize, y * targetTileSize, targetTileSize, targetTileSize);
                    targetTile.url = url;

                    tiles.push(targetTile);
                    increaseProgress();
                }
            }

        };

        sourceImage.onerror = function () {
            increaseProgress(tilesPerSourceTile * tilesPerSourceTile);
        };
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
        return rankingFunc(tile.imageData.data);
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

    var increaseProgress = function (amount) {
        amount = amount || 1;
        tilesLoaded += amount;
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
        calcTilesRanking:calcTilesRankingAndDisplay,
        readSourceImageData:readSourceImageData
    });

    initTileDisplay();
//    renderTiles();
    readSourceImageData();
});