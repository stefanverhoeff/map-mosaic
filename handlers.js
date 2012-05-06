define(['jquery'], function ($) {
    return {
        init:function () {
            $('#enableCanvas').click(function () {
                canvasEnabled = this.checked;
                initTileDisplay();
                displayTiles();
            });

            $('#enableDom').click(function () {
                domEnabled = this.checked;
                initTileDisplay();
                displayTiles();
            });

            $('input[name=algorithm]').click(function () {
                rankingFunc = rankingFuncs[this.value];

                tilesLoaded = 0;
                for (var i = 0; i < tiles.length; ++i) {
                    calcTileRanking(tiles[i]);
                }

                sortTilesByRanking();
                displayTiles();
            });

            $('input[name=tileType]').click(function () {
                tileType = this.value;
                renderTiles();
            });
        }
    };
});