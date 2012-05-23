require(['jquery', 'lib/nokia-map', 'util', 'ranking', 'handlers', 'display-canvas'], function ($, nokiaMap, util, rankingFuncs, handlers, displayCanvas) {
    "use strict";

    // 128 or 256
    var sourceTileSize = 128;
    // Must be divide-able by source size
    var targetTileSize = 16;
    var tilesPerSourceTile = sourceTileSize / targetTileSize;
    var tileColumns = 32 * 1;
    var tileRows = 32 * 1;
    var tilesTotal;
    var tilesLoaded;
    var tiles;
    var tileType = 'satellite.day';
    var scratchCanvas = $('<canvas></canvas>').appendTo('#scratch')[0];
    var scratchCtx = scratchCanvas.getContext('2d');
    var sourceImageTiles;

    var rankingFunc = rankingFuncs.calcAvgColor;
//    var rankingFunc = rankingFuncs.calcAllColors;

    var statusMessage = function (message) {
        console.log(message);
        $('#statusMessage').text(message);
    };

    var readSourceImageData = function () {
        var sourceImage;
        var x, y;

        statusMessage('Reading source image');

        sourceImageTiles = [];
        sourceImage = $('#sourceImage')[0];

        scratchCanvas.width = sourceImage.width;
        scratchCanvas.height = sourceImage.height;
        scratchCtx.drawImage(sourceImage, 0, 0);

        tilesLoaded = 0;
        tilesTotal = (sourceImage.width / targetTileSize) * (sourceImage.height / targetTileSize);
        resetProgress();
        // TODO: fix sorting randomness - running same filter several times results in differences...
        for (x = 0; x * targetTileSize < sourceImage.width; ++x) {
            for (y = 0; y * targetTileSize < sourceImage.height; ++y) {
                (function (x, y) {
                    setTimeout(function () {
                        var imageTile = {};

                        imageTile.x = x * targetTileSize;
                        imageTile.y = y * targetTileSize;
                        imageTile.imageData = scratchCtx.getImageData(y * targetTileSize, x * targetTileSize, targetTileSize, targetTileSize);

                        sourceImageTiles.push(imageTile);
                        increaseProgress();
                    }, 10);
                })(x, y);
            }
        }

        tiles = sourceImageTiles;
        waitForTilesRendered(function () {
            calcTilesRanking();
        });
    };

    var initTileDisplay = function () {
        displayCanvas.init(tileColumns, tileRows, targetTileSize);
    };

    var renderTiles = function () {
        var x, y;

        statusMessage('Fetching tiles from server');

        tilesTotal = tileColumns * tileRows;
        tilesLoaded = 0;
        tiles = [];

        for (x = 0; x < Math.floor(tileColumns / tilesPerSourceTile); ++x) {
            for (y = 0; y < Math.floor(tileRows / tilesPerSourceTile); ++y) {
                var tileUrl = nokiaMap.getTileUrl(15, 17640 + util.getRandomInt(-100, 100), 10755 + util.getRandomInt(-100, 100), sourceTileSize, tileType);
                fetchTileAndSplit(tileUrl);
            }
        }

        waitForTilesRendered(function () {
            calcTilesRankingAndDisplay();
        });
    };

    var displayTiles = function () {
        var i, row, column;

        statusMessage('Rendering result');

        for (i = 0; i < tiles.length; ++i) {
            row = Math.floor(i / tileColumns);
            column = i - row * tileColumns;

            displayCanvas.renderTile(tiles[i], targetTileSize, row, column);
        }
    };

    var fetchTileAndSplit = function (url) {   
        var sourceMapTile;
        var targetTile;
        var x, y;

        statusMessage('Splitting map tiles');

        sourceMapTile = new Image();
        sourceMapTile.crossOrigin = "anonymous";
        sourceMapTile.src = url;

        sourceMapTile.onload = function () {
            scratchCanvas.width = sourceTileSize;
            scratchCanvas.height = sourceTileSize;
            scratchCtx.drawImage(sourceMapTile, 0, 0);

            for (x = 0; x * targetTileSize < sourceTileSize; ++x) {
                for (y = 0; y * targetTileSize < sourceTileSize; ++y) {
                    targetTile = {};

                    targetTile.imageData = scratchCtx.getImageData(x * targetTileSize, y * targetTileSize, targetTileSize, targetTileSize);
                    targetTile.url = url;

                    tiles.push(targetTile);
                    increaseProgress();
                }
            }

        };

        sourceMapTile.onerror = function () {
            increaseProgress(tilesPerSourceTile * tilesPerSourceTile);
        };
    };

    var calcTilesRankingAndDisplay = function () {
        statusMessage('Calculating tile ranking');

        calcTilesRanking();

        waitForTilesRendered(function () {
            sortTilesBySimilarity();
            displayTiles();
        });
    };

    var calcTilesRanking = function () {
        resetProgress();
        for (var i = 0; i < tiles.length; ++i) {
            var tile = tiles[i];
            // A-sync so progress update can be seen
            (function (theTile) {
                setTimeout(function () {
                    theTile.ranking = calcTileRanking(theTile);
                    increaseProgress();
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

    var sortTilesBySimilarity = function () {
        var tilesMapped = [], tileMatchScore;

        statusMessage('Sorting tiles by image similarity');

        // Iterate source image
        for (var i = 0; i < sourceImageTiles.length; ++i) {
            var matchedTile = tiles[0];
            matchedTile.score = -999;

            // Iterate map-tiles, find closest match for source tile
            for (var j = 0; j < tiles.length; ++j) {

                tileMatchScore = calcTileMatch(sourceImageTiles[i], tiles[j]);
//                tileMatchScore = calcTileMatchRGB(sourceImageTiles[i], tiles[j]);
                if (tileMatchScore > matchedTile.score) {
                    matchedTile = tiles[j];
                    matchedTile.score = tileMatchScore;
                }
            }

            tilesMapped.push(matchedTile);
        }

        tiles = tilesMapped;
    };

    var calcTileMatch = function (imageTile, mapTile) {
        return -Math.abs(imageTile.ranking - mapTile.ranking);
    };

    var calcTileMatchRGB = function (imageTile, mapTile) {
        return 100 * (
            1.0 - ((
                Math.Abs(imageTile.ranking[0] - mapTile.ranking[0]) +
                    Math.Abs(imageTile.ranking[1] - mapTile.ranking[1]) +
                    Math.Abs(imageTile.ranking[2] - mapTile.ranking[2])
            ) / (256.0 * 3))
        );
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

    var start = function () {
        initTileDisplay();
        readSourceImageData();
        waitForTilesRendered(function () {
            renderTiles();
        });
    };

    handlers.init({
        setTileType:function (type) {
            tileType = type;
        },
        setTargetTileSize:function (size) {
            targetTileSize = size;
            tileColumns = 512 / targetTileSize;
            tileRows = 512 / targetTileSize;
        },
        initTileDisplay:initTileDisplay,
        displayTiles:displayTiles,
        calcTileRanking:calcTileRanking,
        sortTilesByRanking:sortTilesByRanking,
        renderTiles:renderTiles,
        calcTilesRanking:calcTilesRankingAndDisplay,
        readSourceImageData:readSourceImageData,
        start:start
    });

    start();
});
