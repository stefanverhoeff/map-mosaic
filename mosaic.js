(function ($, nokia, util) {
    "use strict";

    var appId = "ayTdeMpluq0EkCHDIplm";
    var token = "SxHxfkhbfzGOzF2AeBZTnQ";
    var forceTileSize = 64;
    var width = 16;
    var height = 9;
    var canvasEnabled = $('#enableCanvas').attr('checked');
    var domEnabled = $('#enableDom').attr('checked');
    var tilesTotal, tilesLoaded, tiles;
    var tileType = 'satellite.day';
    var canvas = document.getElementById('mapCanvas');
    var ctx = canvas.getContext('2d');
    var scratchCanvas = $('<canvas></canvas>')[0];
    var scratchCtx = scratchCanvas.getContext('2d');

    var rankingFuncs = {
        calcBySum:function (data, sumFunc) {
            var i, sum = 0;

            for (i = 0; i < data.length; i += 4) {
                sum += sumFunc(data, i);
            }

            return sum / (data.length / 4);
        },
        calcAvgColor:function (data) {
            return rankingFuncs.calcBySum(data, function (data, index) {
                return (data[index] + data[index + 1] + data[index + 2]) / 3.0;
            });
        },
        calcMedianColor:function (data) {
            var i, values = [];

            for (i = 0; i < data.length; i += 4) {
                values.push((data[i] + data[i + 1] + data[i + 2]) / 3.0);
            }

            values.sort();

            return values[Math.floor(values.length / 2)];
        },
        calcAvgRed:function (data) {
            return rankingFuncs.calcBySum(data, function (data, index) {
                return data[index] - (data[index + 1] + data[index + 2]) / 2;
            });
        },
        calcAvgGreen:function (data) {
            return rankingFuncs.calcBySum(data, function (data, index) {
                return data[index + 1] - (data[index] + data[index + 2]) / 2;
            });
        },
        calcAvgBlue:function (data) {
            return rankingFuncs.calcBySum(data, function (data, index) {
                return data[index + 2] - (data[index] + data[index + 1]) / 2;
            });
        }
    };

    var rankingFunc = rankingFuncs.calcAvgColor;

    var initHandlers = function () {
        $('#enableCanvas').click(function () {
            canvasEnabled = this.checked;
            initTiles();
        });

        $('#enableDom').click(function () {
            domEnabled = this.checked;
            initTiles();
        });

        $('input[name=algorithm]').click(function () {
            rankingFunc = rankingFuncs[this.value];

            tilesLoaded = 0;
            for (var i = 0; i < tiles.length; ++i) {
                calcTileRanking(tiles[i]);
            }

            sortAndRenderTilesCanvas();
        });

        $('input[name=tileType]').click(function () {
            tileType = this.value;
            initTiles();
        });
    };

    var initMap = function () {
        // Set up is the credentials to use the API:
        nokia.Settings.set("appId", appId);
        nokia.Settings.set("authenticationToken", token);

        var map = new nokia.maps.map.Display(
            document.getElementById("mapContainer"), {
                // Zoom level for the map
                'zoomLevel':10,
                // Map center coordinates
                'center':[52.51, 13.4],
                components:[
                    // Behavior collection
                    new nokia.maps.map.component.Behavior(),
                    new nokia.maps.map.component.ZoomBar(),
                    new nokia.maps.map.component.Overview(),
                    new nokia.maps.map.component.TypeSelector(),
                    new nokia.maps.map.component.ScaleBar() ]
            });
//        map.set("baseMapType", nokia.maps.map.Display.SATELLITE);

        $('#mapContainer').show();
    };

    var initTiles = function () {
        tilesTotal = width * height;
        tilesLoaded = 0;
        tiles = [];

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

        renderTiles();
    };

    var renderTiles = function () {
        var x, y;

        if (! canvasEnabled && ! domEnabled) {
            return;
        }

        for (x = 0; x < width; ++x) {
            for (y = 0; y < height; ++y) {
                var tileUrl = getTileUrl(15, 17640 + util.getRandomInt(-100, 100), 10755 + util.getRandomInt(-100, 100));
                var tile;

                tile = fetchTile(tileUrl);
                tiles.push(tile);
            }
        }

        waitForTilesRendered(sortAndRenderTilesCanvas);
    };

    var renderTileDom = function (tile, size) {
        $('#tiles').append(tile.image)
            .children().last().attr({
                width:size,
                height:size
            });
    };

    var sortAndRenderTilesCanvas = function () {
        var i, x, y;
        sortTilesByColor();

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

    var sortTilesByColor = function () {
        tiles.sort(function (a, b) {
            return a.ranking - b.ranking;
        });
    };

    var getTileUrl = function (zoom, x, y) {
        var url, server;

        zoom = zoom || 15;
        x = x || 17600;
        y = y || 10750;

        server = util.getRandomInt(1, 4);

        url = "/map-tiles-" + server + "/newest/" + tileType + "/" + zoom + "/" + x + "/" + y + "/128/png8?token=" + token + "&app_id=" + appId;
        return url;
    };

    var updateProgress = function (loaded, total) {
        $('progress')[0].value = loaded;
        $('progress')[0].max = total;
        $('#tiles-loaded').text(loaded);
        $('#tiles-total').text(total);
    };

    initHandlers();
//    initMap();
    initTiles();

})($, nokia, util);