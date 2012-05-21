require(['jquery', 'lib/nokia-map', 'util', 'ranking', 'handlers', 'display-canvas', 'display-dom'], function ($, nokiaMap, util, rankingFuncs, handlers, displayCanvas, displayDom) {
    "use strict";

    // 128 or 256
    var sourceTileSize = 128;
    // Must be divide-able by source size
    var targetTileSize = 16;
    var tilesPerSourceTile = sourceTileSize / targetTileSize;
    var width = 32;
    var height = 32;
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

        statusMessage('Fetching tiles from server');

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

        statusMessage('Rendering result');

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
        var sourceMapTile;
        var targetTile;
        var x, y;

        statusMessage('Splitting map tiles');

        sourceMapTile = new Image();

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
        setTargetTileSize:function (size) {
            targetTileSize = size;
            width = 512 / targetTileSize;
            height = 512 / targetTileSize;
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
