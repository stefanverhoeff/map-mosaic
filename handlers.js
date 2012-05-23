define(['jquery'], function ($) {
    "use strict";

    return {
        init:function (mosaic) {
            $('#test-image').change(function () {
                var sourceImage;
                $('#sourceImage').attr('src', this.value);
                $('#sourceImage').load(function () {
                    sourceImage = $('#sourceImage')[0];
                    mosaic.setSourceImage(sourceImage);
                    mosaic.start();
                });
            });

            $('input[name=algorithm]').click(function () {
                mosaic.setRankingFunc(this.value);
                mosaic.calcTilesRanking();
            });

            $('input[name=tileSize]').change(function () {
                var size = parseInt(this.value, 10);
                mosaic.setTargetTileSize(size);
                $('#tileSizeValue').html(size);
            });

            $('input[name=mapTilesToFetch]').change(function () {
                var size = parseInt(this.value, 10);
                mosaic.setMapTilesToFetch(size);
                $('#mapTilesToFetchValue').html(size);
                $('#mapTilesToFetchMiniValue').html(size * mosaic.getTilesPerSourceTile());
            });

            $('input[name=tileType]').click(function () {
                mosaic.initTileDisplay();

                if (this.value === 'sourceImage') {
                    mosaic.readSourceImageData();
                }
                else {
                    mosaic.setTileType(this.value);
                    mosaic.fetchMapTiles();
                }
            });

            // Set initial values from input defaults
            var tileSize = parseInt($('input[name=tileSize]').attr('value'), 10);
            var tileType = $('input[name=tileType]').filter(':checked').attr('value');
            var sourceImage = $('#sourceImage')[0];
            var mapTilesToFetch = parseInt($('input[name=mapTilesToFetch]').attr('value'), 10);

            mosaic.setTargetTileSize(tileSize);
            $('#tileSize').html(tileSize);

            mosaic.setTileType(tileType);

            mosaic.setSourceImage(sourceImage);

            mosaic.setMapTilesToFetch(mapTilesToFetch);
        }
    };
});
