define(['../util'], function (util, nokia) {
    "use strict";

    var appId = "ayTdeMpluq0EkCHDIplm";
    var token = "SxHxfkhbfzGOzF2AeBZTnQ";

    return {
        appId:appId,
        token:token,
        display:function () {
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

        },
        getTileUrl:function (zoom, x, y, tileSize, tileType) {
            var url, server;

            zoom = zoom || 15;
            x = x || 17600;
            y = y || 10750;
            tileType = tileType || 'satellite.day';

            server = util.getRandomInt(1, 4);

            url = "/map-tiles-" + server + "/newest/" + tileType + "/" + zoom + "/" + x + "/" + y + "/" + tileSize + "/png8?token=" + token + "&app_id=" + appId;
            return url;
        }
    }
});
