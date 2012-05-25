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
                });
            });

            $('input[name=algorithm]').click(function () {
                mosaic.setRankingFunc(this.value);
            });

            $('input[name=tileSize]').change(function () {
                var size = parseInt(this.value, 10);
                mosaic.setTargetTileSize(size);
                updateTileCounts();
            });

            $('input[name=mapTilesToFetch]').change(function () {
                var size = parseInt(this.value, 10);
                mosaic.setMapTilesToFetch(size);
                updateTileCounts();
            });

            $('input[name=tileType]').click(function () {
                mosaic.setTileType(this.value);
            });

            $('#mapCanvas').click(function () {
                var sourceImageName = $('#test-image').attr('value');
                var tileSize = $('input[name=tileSize]').attr('value');
                window.open(this.toDataURL("image/png"), 'mosaic-' + sourceImageName + '-' + tileSize + 'x' + tileSize);
            });

            $('#go-button').click(function () {
                mosaic.setMapTilesRefetchEnabled(false);
                mosaic.start();
            });

            $('#go-button-new-tiles').click(function () {
                mosaic.setMapTilesRefetchEnabled(true);
                mosaic.start();
            });

            var updateTileCounts = function () {
                var imgWidth = $('#sourceImage')[0].width;
                var imgHeight = $('#sourceImage')[0].height;
                var sourceTilesMini = Math.floor((imgWidth / mosaic.getTargetTileSize()) * (imgHeight / mosaic.getTargetTileSize()));
                var mapTilesMini = Math.floor(mosaic.getMapTilesToFetch() * mosaic.getTilesPerSourceTile());
                $('#mapTilesToFetchValue').html(mosaic.getMapTilesToFetch());
                $('#mapTilesToFetchMiniValue').html(mapTilesMini);
                $('#tileSizeValue').html(mosaic.getTargetTileSize());
                $('#sourceTilesMiniValue').html(sourceTilesMini);
            };

            // Set initial values from input defaults
            var tileSize = parseInt($('input[name=tileSize]').attr('value'), 10);
            var tileType = $('input[name=tileType]').filter(':checked').attr('value');
            var sourceImage = $('#sourceImage')[0];
            var mapTilesToFetch = parseInt($('input[name=mapTilesToFetch]').attr('value'), 10);
            var rankingFunc = $('input[name=algorithm]').filter(':checked').attr('value');

            mosaic.setTargetTileSize(tileSize);
            mosaic.setTileType(tileType);
            mosaic.setSourceImage(sourceImage);
            mosaic.setMapTilesToFetch(mapTilesToFetch);
            mosaic.setRankingFunc(rankingFunc);

            updateTileCounts();
        }
    };
});
