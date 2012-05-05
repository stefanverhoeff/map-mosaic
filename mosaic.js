(function () {
    var appId = "ayTdeMpluq0EkCHDIplm";
    var token = "SxHxfkhbfzGOzF2AeBZTnQ";
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
        map.set("baseMapType", nokia.maps.map.Display.SATELLITE);

        $('#mapContainer').show();
    };

    var initTiles = function () {
        var x, y;

        for (x = 0; x < 6; ++x) {
            for (y = 0; y < 6; ++y) {
                    $('#tiles').append('<img />')
                    .children().last().attr('src', getTile(15, 17600 + x, 10750 + y));
            }
        }
    };

    var getTile = function (zoom, x, y) {
        var url;
        zoom = zoom || 15;
        x = x || 17600;
        y = y || 10750;

        url = "http://4.maptile.lbs.ovi.com/maptiler/v2/maptile/newest/satellite.day/" + zoom + "/" + x + "/" + y + "/256/png8?token=" + token + "&app_id=" + appId;
        return url;
    };

//    initMap();
    initTiles();

})();