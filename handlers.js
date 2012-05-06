define(['jquery'], function ($) {
    "use strict";

    return {
        init:function (mosaic) {
            $('#enableCanvas').click(function () {
                mosaic.setCanvasEnabled(this.checked);
                mosaic.initTileDisplay();
                mosaic.displayTiles();
            });

            $('#enableDom').click(function () {
                mosaic.setDomEnabled(this.checked);
                mosaic.initTileDisplay();
                mosaic.displayTiles();
            });

            $('input[name=algorithm]').click(function () {
                mosaic.setRankingFunc(this.value);

                mosaic.setTilesLoaded(0);
                for (var i = 0; i < mosaic.getTiles().length; ++i) {
                    mosaic.calcTileRanking(mosaic.getTiles()[i]);
                }

                mosaic.sortTilesByRanking();
                mosaic.displayTiles();
            });

            $('input[name=tileType]').click(function () {
                mosaic.setTileType(this.value);
                mosaic.renderTiles();
            });
        }
    };
});