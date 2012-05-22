define(['jquery'], function ($) {
    "use strict";

    return {
        init:function (mosaic) {
            $('input[name=algorithm]').click(function () {
                mosaic.setRankingFunc(this.value);
                mosaic.calcTilesRanking();
            });

            $('input[name=tileSize]').change(function () {
                mosaic.setTargetTileSize(parseInt(this.value, 10));
                mosaic.start();
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
