(function($, L, w, undef) {
    'use strict';

    var defaults = {
        selectors: {
            mapHolder: '#shipping-map .map-container',
            menuHolder: '.map-menu',
            templates: {
                menu: {
                    ship: '#shipMenuTemplate',
                    event: '#eventMenuTemplate'
                }
            }
        },
        breakpoints: {
            handheld: 768,
            tablet: 980,
            laptop: 1200,
            desktop: 20000
        },
        tileSet: {
            url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        },
        api: {
            url: 'json/test1.json'
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
        closeOnContentClick: false,
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

    };

    $(document).ready(function() {
        var templates = {
            menu: {
                ship: false,
                event: false
            }
        },
        ships = {},
        eventTypes = {};

        // Fetch geoJSON data
        $.getJSON(defaults.api.url, function(data) {

            var config = $.extend(true, defaults, data),
                $mapHolder = $(config.selectors.mapHolder),
                $menuHolder = $(config.selectors.menuHolder),
                $shipsMenu = $('.ships ul', $menuHolder),
                map = L.map('map'),
                popup = L.popup();


            console.log($menuHolder.html());

            // Prepare templates
            templates.menu.ship = $.templates(config.selectors.templates.menu.ship);
            templates.menu.event = $.templates(config.selectors.templates.menu.event);

            // Initialise the map
            map.setView(config.locations.center.coords, config.locations.center.zoom);

            // Add tiles
            L.tileLayer(config.tileSet.url, {
                attribution: config.tileSet.attribution,
                minZoom: 2,
                maxZoom: 12
            }).addTo(map);


            // Iterate over each ship and massage data
            $.each(config.ships, function(i, ship) {
                var j = 0,
                    len = ship.geojson.features.length,
                    previous = {},
                    paths = [],
                    points = [],
                    style = $.extend(true, config.style, ship.style);

                // Add each interactive event or feature to the map
                $.each(ship.geojson.features, function(i, f) {
                    // Add this feature to the map
                    var point = L.geoJson(f, {
                        style: style.point.default,
                        // add each point feature as a circle marker with its
                        // specific style
                        pointToLayer: function(feature, latlng) {
                            // Point marker

                            if (++j < len) {
                                // Standard event marker,
                                // @todo Switch based on type
                                previous = latlng;
                                return L.circleMarker(latlng, style.point);
                            } else {
                                // Last marker in the array, so show the ship icon

                                // Show right facing icon if ship is moving east
                                if (previous.lng && previous.lng < latlng.lng) {
                                    style.icon.default.iconUrl = style.icon.default.iconUrl.replace('_100.', '_100_right.');
                                }

                                return L.marker(latlng, {
                                    icon: L.icon($.extend(true, style.icon.default, {className: 'ship-icon ' + ship.nameSimple}))
                                });
                            }
                        },
                        // add extra data: heading, text, summary
                        onEachFeature: function(feature, layer) {
                            if (feature.properties.type && !feature.properties.type in eventTypes) {
                                eventTypes.push(feature.properties.type);
                            }

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
                ships[ship.id] = {
                    paths: paths,
                    points: points,
                    name: ship.name,
                    nameSimple: ship.nameSimple,
                    style: style
                };

            });


            /* @todo Build navigation menu with json or backend? */

            $.each(ships, function(id, shipData) {
//                console.log(id);
                console.log(shipData);
                console.log(templates.menu.ship);
                console.log($shipsMenu);

                var html = templates.menu.ship.render({
                    name: shipData.name,
                    simpleName: shipData,
                    id: id
                });

                console.log(html);

                $shipsMenu.append(html);
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


            // Initalised jRespond with breakpoints
            var jRes = jRespond([
                {
                    label: 'handheld',
                    enter: 0,
                    exit: config.breakpoints.handheld - 1
                }, {
                    label: 'tablet',
                    enter: config.breakpoints.handheld,
                    exit: config.breakpoints.tablet - 1
                }, {
                    label: 'laptop',
                    enter: config.breakpoints.tablet,
                    exit: config.breakpoints.laptop - 1
                }, {
                    label: 'desktop',
                    enter: config.breakpoints.laptop,
                    exit: config.breakpoints.desktop
                }
            ]);

            // Initialise jPanelMenu now that the templates have been built
            jPM.on();

            // Automatically show panel menu at large screen sizes,
            // and hide at small sizes
            jRes.addFunc([{
                    breakpoint: ['handheld'],
                    enter: function() {
                        jPM.close();
                    },
                    exit: function() {
                    }
                }, {
                    breakpoint: ['laptop', 'desktop'],
                    enter: function() {
                        jPM.open();
                    },
                    exit: function() {
                        //
                    }
                }]);


        }).fail(function() {
            console.log('Error fetching ' + defaults.api.url);
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

