(function () {
    var appId = "ayTdeMpluq0EkCHDIplm";
    var token = "SxHxfkhbfzGOzF2AeBZTnQ";
    var forceTileSize = 64;
    var width = 16;
    var height = 8;
    var canvasEnabled = $('#enableCanvas').attr('checked');
    var domEnabled = $('#enableDom').attr('checked');
    var tilesTotal, tilesLoaded, tiles;

    var canvas = document.getElementById('mapCanvas');
    var ctx = canvas.getContext('2d');

    var initHandlers = function () {
        $('#enableCanvas').click(function () {
            canvasEnabled = this.checked;
            initTiles();
        });
        $('#enableDom').click(function () {
            domEnabled = this.checked;
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

        for (x = 0; x < width; ++x) {
            for (y = 0; y < height; ++y) {
                var tileUrl = getTileUrl(15, 17600 + getRandomInt(-50, 50), 10750 + getRandomInt(-50, 50));
                var tile;

                if (domEnabled) {
                    renderTileDom(tileUrl, forceTileSize);
                }

                if (canvasEnabled) {
                    tile = fetchTile(tileUrl);
                    tiles.push(tile);
                }
            }
        }

        waitForTilesRendered(function () {
            var i, x, y;
//            sortTilesByColor();
            for (i=0; i < tiles.length; ++i) {
                x = i % width;
                y = i - x*width;
                renderTileCanvas(tile, forceTileSize, x, y);
            }
        });
    };

    var renderTileDom = function (url, size) {
        $('#tiles').append('<img />')
            .children().last().attr({
                src:url,
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
            var data, sum, x, y;
            var scratchCanvas, scratchCtx;

            scratchCanvas = $('<canvas></canvas>')[0];
            scratchCanvas.width = this.width;
            scratchCanvas.height = this.height;
            scratchCtx = scratchCanvas.getContext('2d');
            scratchCtx.drawImage(this, 0, 0);
            sum = 0;

            for (x = 0; x < this.width; ++x) {
                for (y = 0; y < this.height; ++y) {
                    pixel = scratchCtx.getImageData(x, y, 1, 1);
                    sum += (pixel.data[0] + pixel.data[1] + pixel.data[2]) / 3.0;
                }
            }
            tile.avgColor = sum / (this.width * this.height);

            tilesLoaded++;
            updateProgress(tilesLoaded, tilesTotal);
        };

        return tile;
    };

    var waitForTilesRendered = function (callback) {
        var waitHandle = setInterval(function () {
            if (tilesLoaded === tilesTotal) {
                clearInterval(waitHandle);
                callback();
            }
        }, 100);
    };

    var getTileUrl = function (zoom, x, y) {
        var url;
        zoom = zoom || 15;
        x = x || 17600;
        y = y || 10750;

        url = "/map-tiles/newest/satellite.day/" + zoom + "/" + x + "/" + y + "/128/png8?token=" + token + "&app_id=" + appId;
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

})();