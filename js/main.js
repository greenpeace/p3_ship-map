(function($, L, w, undef) {
    'use strict';

    var defaults = {
        api: {
            url: 'json/test1.json'
        },
        tileSet: {
            url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        },
        selectors: {
            mapContainer: '#shipping-map .map-container',
            map: '#map',
            menu: {
                container: '.map-menu',
                ship: '.map-menu .ships ul',
                feature: '.map-menu .features ul'
            },
            templates: {
                menu: {
                    ship: '#shipMenuTemplate',
                    feature: '#featureMenuTemplate'
                },
                popup: {
                    feature: '#featurePopupTemplate'
                }
            }
        },
        breakpoint: {
            oldmobile: 320,
            handheld: 768,
            tablet: 980,
            laptop: 1200,
            desktop: 20000
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
    jPM = undefined,
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
        buildPattern = function(path, style, className) {
            var pattern = {};

            pattern.pathStyle = path.properties.period === 'future' ? style.path.future : style.path.default;

            pattern.pathStyle.className = className;

            pattern.offset = pattern.pathStyle.offset;
            pattern.repeat = pattern.pathStyle.repeat;

            pattern.symbol = new L.Symbol.Dash(pattern.pathStyle);

            return pattern;
        };

    $(document).ready(function() {
        var templates = {
            menu: {
                ship: {},
                feature: {}
            },
            popup: {
                feature: {}
            }
        },
        ships = {},
            features = {
                data: {
                    types: [] // Stores metadata about the features, such as identifiers and human-readable names
                        // Will also contain arrays of features for later grouping
                },
                groups: {
                    all: {}   // A utility layerGroup containing all map features
                    // Additional groups will be created under the type identifier property
                }
            };

        // Fetch geoJSON data
        $.getJSON(defaults.api.url, function(data) {

            var config = $.extend(true, defaults, data),
                $mapHolder = $(config.selectors.mapContainer),
                $shipsMenu = $(config.selectors.menu.ship),
                $featuresMenu = $(config.selectors.menu.feature),
                map = L.map('map');


            // Prepare templates
            templates.menu.ship = $.templates(config.selectors.templates.menu.ship);
            templates.menu.feature = $.templates(config.selectors.templates.menu.feature);

            templates.popup.feature = $.templates(config.selectors.templates.popup.feature);

            // Initialise the map
            map.setView(config.locations.center.coords, config.locations.center.zoom);


            // Add tiles
            L.tileLayer(config.tileSet.url, {
                attribution: config.tileSet.attribution,
                minZoom: 2,
                maxZoom: 12
            }).addTo(map);


            // Iterate over each ship and perpare layer data
            $.each(config.ships, function(i, ship) {
                var j = 0,
                    len = ship.geojson.features.length,
                    previous = {},
                    layers = {
                        data: {
                            features: {
                                types: [],
                                all: []
                            },
                            paths: {
                                periods: [],
                                all: []
                            },
                            all: []
                        },
                        groups: {
                            all: {},
                            features: {},
                            paths: {}
                        }
                    },
                style = $.extend(true, config.style, ship.style);

                console.log(' ===> Building data for ship ' + ship.name);

                /*
                 * Ship Featured Events
                 *
                 * Adds each interactive feature to the map
                 *
                 */

                $.each(ship.geojson.features, function(index, f) {

                    // Add this feature to the map
                    var feature,
                        type = {
                            identifier: makeSafeForCSS(f.properties.type),
                            name: f.properties.type
                        };
//                        markers = new L.MarkerClusterGroup();

                    feature = L.geoJson(f, {
                        style: style.point.default,
                        // Add each point feature as a circle marker with its
                        // specific style
                        pointToLayer: function(feature, latlng) {
                            var icon = undefined;
                            // Point marker

                            if (index < len - 1) {
                                // Standard event marker,
                                // @todo Switch based on type
                                previous = latlng;

                                f.properties.icon = 'circle';

                                return L.circleMarker(latlng, style.point);

                            } else {
                                // Last marker in the array, so show the ship icon

                                // Show right facing icon if ship is moving east
                                if (previous.lng && previous.lng < latlng.lng) {
                                    style.icon.default.iconUrl = style.icon.default.iconUrl.replace('_100.', '_100_right.');
                                }

                                icon = L.icon($.extend(true, style.icon.default, {className: 'ship-icon ' + ship.nameSimple}));

                                f.properties.edgeMarker = true;
                                f.properties.icon = icon;

                                return L.marker(latlng, {
                                    icon: icon
                                });

                            }
                        },
                        // Set popup content
                        onEachFeature: function(feature, layer) {

                            layer.bindPopup(templates.popup.feature.render({
                                index: index,
                                name: ship.name,
                                nameSimple: ship.nameSimple,
                                id: ship.id,
                                title: feature.properties.name,
                                subtitle: feature.properties.type,
                                timestamp: feature.properties.timestamp,
                                humanTime: timeString(feature.properties.timestamp),
                                summary: feature.properties.summary
                            }));

                        }
                    }).addTo(map);

//                    markers.addLayer(feature);

                    if ($.grep(layers.data.features.types, function(item) {
                        return item.identifier === type.identifier;
                    }).length < 1) {
                        console.log(i + '.' + j + ' data.features.' + type.identifier);

                        // Store this in the ship specific data object
                        // for use in constructing the menu
                        layers.data.features.types.push(type);

                        // Initalise the array to store instatnces of this point type
                        layers.data.features[type.identifier] = [];

                        // And do the same for the all-ships list of types
                        if ($.grep(features.data.types, function(item) {
                            return item.identifier === type.identifier;
                        }).length < 1) {
                            features.data.types.push(type);
                            features.data[type.identifier] = [];
                        }
                    }

                    // Store in the features array for toggling entire ship
                    layers.data.all.push(feature);

                    features.data[type.identifier].push(feature);

                    // Store it in the feature specific array
//                    layers.data.features[type.identifier].push[feature];

                }); // End ship.geojson.features


                // Now that we have all the features,
                // create ship-specific layerGroups from arrays of features
//                $.each(layers.data.features.types, function(j, n) {
//                    console.log(i + '.' + j + ' layerGroup: features.' + n.identifier);
//                    layers.groups.features[n] = L.layerGroup(layers.data.features.types[n]);
//                });


                /*
                 * Ship Paths
                 *
                 * Adds each path type to the map
                 *
                 */
                $.each(ship.geojson.paths, function(j, path) {
                    var polylineDecorator,
                        coords = [],
                        period = {
                            identifier: makeSafeForCSS(path.properties.period),
                            name: path.properties.period
                        };

                    $.each(path.coordinates, function(k, lnglat) {
                        // geojson coordinate system is the reverse of leaflet default
                        coords.push([lnglat[1], lnglat[0]]);
                    });

                    polylineDecorator = L.polylineDecorator(L.polyline(coords), {
                        patterns: [buildPattern(path, style, 'ship-' + ship.id)]
                    });

                    // Store this path for toggling on and off
                    layers.data.all.push(polylineDecorator);

                }); // End ship.geojson.paths

                // Create the layerGroup which controls this entire ship
                layers.groups.all = L.layerGroup(layers.data.all);

                // Add this ship's layerGroup to the map
                map.addLayer(layers.groups.all);

                // Store relevant variables for toggling from menu
                ships[ship.id] = {
                    layers: layers,
                    name: ship.name,
                    nameSimple: ship.nameSimple,
                    id: ship.id,
                    style: style
                };

                // Build ship submenu
                /* @todo Should this really be built in javascript, or in the backend? */
                $shipsMenu.append(templates.menu.ship.render({
                    name: ship.name,
                    simpleName: ship.nameSimple,
                    id: ship.id
                }));

                console.log(' <=== End ' + ship.name);

            }); // End each ship

            // Build overall feature layer groups

            // For each feature type, we need to build a submenu item, and create its layerGroup
            $.each(features.data.types, function(i, type) {

                // Render submenu
                /* @todo Should this really be built in javascript, or in the backend? */
                $featuresMenu.append(templates.menu.feature.render({
                    name: type.name,
                    type: type.identifier
                }));

                /* Although the ships[n].groups.all object contains these features, and
                 * has already been added to the map, we need to add the features
                 * layerGroups as well, else we can't toggle them on and off */
                features.groups[type.identifier] = L.layerGroup(features.data[type.identifier]).addTo(map);
            });

            /* Register sidemenu SHIPS button event handlers */
            $(document).on('click', '.map-menu .ships button', function(e) {

                var $this = $(this),
                    id = $this.attr('data-ship-id');

                if (id) {
                    e.preventDefault();

                    console.log('Toggle all ' + $this.parent().attr('class') + ' layers');

                    if ($this.toggleClass('hideLayer').hasClass('hideLayer')) {
                        // Remove paths,
                        map.removeLayer(ships[id].layers.groups.all);

                    } else {
                        map.addLayer(ships[id].layers.groups.all);

                        $.each(features.data.types, function(i, type) {
                            if ($('button[data-feature-type="' + type.identifier + '"]').hasClass('hideLayer')) {
                                // This is a bit of a hack isn't it....
                                map.addLayer(features.groups[type.identifier])
                                    .removeLayer(features.groups[type.identifier]);
                            }
                        });
                    }

                } else if ($this.hasClass('toggleMenu')) {
                    $this.toggleClass('closed').next().toggleClass('close');
                } else {
                    console.warn('Unhandled');
                }

            });

            /* Register sidemenu FEATURES button event handlers */
            $(document).on('click', '.map-menu .features button', function(e) {

                var $this = $(this),
                    type = $this.attr('data-feature-type');

                if (type) {
                    e.preventDefault();

                    if ($this.toggleClass('hideLayer').hasClass('hideLayer')) {
                        // Remove events for all ships,
                        map.removeLayer(features.groups[type]);
                    } else {
                        // Remove events for all ships,
                        map.addLayer(features.groups[type]);
                    }

                } else if ($this.hasClass('toggleMenu')) {
                    $this.next().toggleClass('close');
                } else {
                    console.warn('Unhandled');
                }

            });


            /* Add edge markers to offscreen icons
             * @todo only show ship icons here
             * @todo style icons to suit
             */
            L.edgeMarker({fillColor: 'pink'}).addTo(map);

            map.on('click', function(e) {
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent("You clicked the map at " + e.latlng.toString())
                    .openOn(map);
            });

            setTimeout(function() {
                $mapHolder.addClass('show');
            }, 1000);


            // Initalised jRespond with breakpoint
            var jRes = jRespond([
                {
                    label:'oldmobile',
                    enter: 0,
                    exit: config.breakpoint.oldmobile - 1
                }, {
                    label: 'handheld',
                    enter: config.breakpoint.oldmobile,
                    exit: config.breakpoint.handheld - 1
                }, {
                    label: 'tablet',
                    enter: config.breakpoint.handheld,
                    exit: config.breakpoint.tablet - 1
                }, {
                    label: 'laptop',
                    enter: config.breakpoint.tablet,
                    exit: config.breakpoint.laptop - 1
                }, {
                    label: 'desktop',
                    enter: config.breakpoint.laptop,
                    exit: config.breakpoint.desktop
                }
            ]);

            jPM = $.jPanelMenu({
                    direction: 'right',
                    closeOnContentClick: false,
                    openPosition: config.breakpoint.oldmobile + 'px',
                    afterOpen: function() {
                        $('.jPanelMenu-panel nav').addClass('active');
                        $('#shipping-map').addClass('narrow');
                    },
                    afterClose: function() {
                        $('.jPanelMenu-panel nav').removeClass('active');
                        $('#shipping-map').removeClass('narrow');
                    }
                });

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
        //            // Hide any currently visibile features not in the returned bounding box
        //
        //            // Add new features
        //        });
        //
        //    }
        //    map.on('moveend', onMapMove);


    }); // End document.ready()


}(jQuery, L, this));

