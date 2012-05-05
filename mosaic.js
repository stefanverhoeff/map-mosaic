(function () {
    var initMap = function () {
        // Set up is the credentials to use the API:
        nokia.Settings.set("appId", "ayTdeMpluq0EkCHDIplm");
        nokia.Settings.set("authenticationToken", "SxHxfkhbfzGOzF2AeBZTnQ");

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
    };

    var initTiles = function () {

    };

    initMap();
    initTiles();

})();