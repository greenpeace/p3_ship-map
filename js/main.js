(function($, L, w, undef) {
    'use strict';

    var defaults = {
        mapHolder: '#shipping-map .map-container',
        menuHolder: '.map-menu',
        tileSet: {
            url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        },
        api: {
            url: window.location + 'api/ships/'
        },
        locations: {
            center: {
                coords: [-42, 147],
                zoom: 6
            }
        },
        style: {
            point: {
                default: {
                    radius: 8,
                    fillColor: "white",
                    color: "black",
                    weight: 8,
                    opacity: 1,
                    fillOpacity: 0.8
                }
            },
            icon: {
                default: {
                    iconUrl: "img/icons/rainbow-warrior_100.png",
                    shadowUrl: "",
                    iconSize: [100, 100],
                    shadowSize: [0, 0],
                    iconAnchor: [50, 80],
                    shadowAnchor: [0, 0],
                    popupAnchor: [-3, 0]
                }
            },
            path: {
                default: {
                    offset: 0,
                    repeat: '20px',
                    pixelSize: 8,
                    pathOptions: {
                        color: "#fff"
                    }
                },
                future: {
                    offset: 0,
                    repeat: '20px',
                    pixelSize: 4,
                    pathOptions: {
                        color: "#ccc",
                        opacity: 0.5
                    }
                }
            }
        }
    },
    jPM = $.jPanelMenu({
        direction: 'right',
        afterOpen: function() {
            $('.jPanelMenu-panel nav').addClass('active');
        },
        afterClose: function() {
            $('.jPanelMenu-panel nav').removeClass('active');
        }
    }),
    timeString = function(timestamp) {
        var minutes = Math.floor((new Date() - new Date(timestamp)) / 1000 / 60);

        if (minutes < 1440) {
            return 'today';
        }

        if (minutes >= 1440 && minutes < 2880) {
            return 'yesterday';
        }

        if (minutes >= 2880 && minutes < 10080) {
            return Math.floor(minutes / 60 / 24) + ' days ago';
        }

        if (minutes >= 10080 && minutes < 20160) {
            return 'a week ago';
        }

        if (minutes >= 20160 && minutes < 80640) {
            return Math.floor(minutes / 60 / 24 / 7) + ' weeks ago';
        }

        // more than 8 weeks
        return Math.floor(minutes / 60 / 24 / 7 / 4) + ' months ago';

    },
    ships = {};


    $(document).ready(function() {
        var $mapHolder = $(defaults.mapHolder),
            $menuHolder = $(defaults.menuHolder),
            jsonURL = defaults.api.url + 'get/?file=test1';

        // Initialise jPanelMenu
        jPM.on();

        // Fetch JSON data, and update geoJSON layer
        $.getJSON(jsonURL, function(data) {

            var config = $.extend(true, defaults, data),
                map = L.map('map'),
                popup = L.popup();

            // Initialise the map
            map.setView(config.locations.center.coords, config.locations.center.zoom);

            // Add tiles
            L.tileLayer(config.tileSet.url, {
                attribution: config.tileSet.attribution,
                minZoom: 2,
                maxZoom: 12
            }).addTo(map);

            $.each(config.ships, function(i, ship) {
                var j = 0,
                    len = ship.geojson.features.length,
                    previous = {},
                    paths = [],
                    points = [],
                    style = $.extend(true, config.style, ship.style);

                // Add each interactive feature to the map
                $.each(ship.geojson.features, function(i, f) {
                    // Add this feature to the map
                    var point = L.geoJson(f, {
                        style: style.point.default,
                        // add each point feature as a circle marker with its
                        // specific style
                        pointToLayer: function(feature, latlng) {
                            // Point marker

                            // If this is the last marker in the array
                            if (++j === len) {

                                // Show the ship icon
                                var className = 'ship-icon ' + ship.nameSimple;

                                // Show right facing icon if ship is moving east
                                if (previous.lng && previous.lng < latlng.lng) {
                                    style.icon.default.iconUrl = style.icon.default.iconUrl.replace('_100.', '_100_right.');
                                }

                                return L.marker(latlng, {
                                    icon: L.icon($.extend(true, style.icon.default, {className: className}))
                                });
                            } else {
                                previous = latlng;
                                return L.circleMarker(latlng, style.point);
                            }
                        },
                        // add extra data: heading, text, summary
                        onEachFeature: function(feature, layer) {

                            if (feature.properties && (feature.properties.summary || feature.properties.timestamp)) {
                                // Either summary or timestamp is enough to show popup
                                layer.bindPopup("<h2>" + feature.properties.name + "</h2>"
                                    + '<h3>' + ship.name
                                    + (feature.properties.type
                                        ? ' - ' + feature.properties.type + '</h3>'
                                        : '') + '</h3>'
                                    + (feature.properties.timestamp
                                        ? '<time datetime="' + feature.properties.timestamp + '" title="' + feature.properties.timestamp + '">'
                                        + timeString(feature.properties.timestamp) + '</time>'
                                        : '')
                                    + (feature.properties.summary
                                        ? '<p class="summary">' + feature.properties.summary + '</p>'
                                        : '')
                                    );
                            } else {
                                console.warn(feature);
                            }
                        }
                    }).addTo(map);

                    // Add to array
                    points.push(point);
                });

                // Add each line path to the map
                $.each(ship.geojson.paths, function(i, path) {
                    var polyline,
                        coords = [],
                        pathStyle = (path.period === 'future') ? style.path.future : style.path.default,
                        patterns = [
                            {
                                offset: pathStyle.offset,
                                repeat: pathStyle.repeat,
                                symbol: new L.Symbol.Dash(pathStyle)
                            }
                        ];

                    $.each(path.coordinates, function(j, lnglat) {
                        // geojson coordinate system is the reverse of leaflet default
                        coords.push([lnglat[1], lnglat[0]]);
                    });

                    polyline = L.polylineDecorator(L.polyline(coords), {patterns: patterns}).addTo(map);

                    paths.push(polyline);
                });

                /* Build menu item
                 * @todo Replace static menu items with dynamically generated items
                 *       based on the ships and event types available
                 */


                // Store relevant variables for toggling from menu
                ships[ship.nameSimple] = {
                    paths: paths,
                    points: points,
                    json: data
                };

            });

            /* Add edge markers to offscreen icons
             * @todo only show ship icons here
             * @todo style icons to suit
             */
            L.edgeMarker({fillColor: 'pink'}).addTo(map);

            map.on('click', function(e) {
                popup
                    .setLatLng(e.latlng)
                    .setContent("You clicked the map at " + e.latlng.toString())
                    .openOn(map);
            });

            setTimeout(function() {
                $mapHolder.addClass('show');
            }, 1000);

        }).fail(function() {
            console.log('Error fetching ' + jsonURL);
        });

        //    function onMapMove() {
        //        var bounds = map.getBounds();
        //        var minll = bounds.getSouthWest();
        //        var maxll = bounds.getNorthEast();
        //
        //        $.getJSON(apiBaseURL + '/get/box' + '?bounds=' + minll.lng + ',' + minll.lat + ',' + maxll.lng + ',' + maxll.lat, function(ship) {
        //            console.log(ship);
        //
        //            // Hide any currently visibile points not in the returned bounding box
        //
        //            // Add new points
        //        });
        //
        //    }
        //    map.on('moveend', onMapMove);

    }); // End document.ready()


}(jQuery, L, this));

