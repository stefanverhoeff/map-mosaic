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
                mosaic.calcTilesRanking();
            });

            $('input[name=tileType]').click(function () {
                mosaic.initTileDisplay();

                if (this.value === 'sourceImage') {
                    mosaic.readSourceImageData();
                }
                else {
                    mosaic.setTileType(this.value);
                    mosaic.renderTiles();
                }
            });
        }
    };
});