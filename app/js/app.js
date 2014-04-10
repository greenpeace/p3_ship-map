/*
 * The MIT License
 *
 * Copyright 2014 Ray Walker <hello@raywalker.it>.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function($, L, M) {
    'use strict';

    var testSucceded = false,
        imageCapabilities = $.Deferred(),
        pngBrowsers = ['Safari'],
        goodBrowser = $.inArray(get_browser(), pngBrowsers) === -1 ? true : false;

    M.load([
        // SVG is supported, it is a retina display, browser is not safari
        // > load retina-ready SVG images
        {
            test: M.svg && M.highresdisplay && goodBrowser,
            yep: ['css!css/retina-svg.css'],
            callback: function(result) {
                console.log('SVG support, retina display: '+ result);
                testSucceded = true;
                imageCapabilities.resolve();
            }
        },
        // SVG supported, not a retina display, browser is okay
        // > load non-retina SVG images
        {
            test: M.svg && !M.highresdisplay && goodBrowser,
            yep: ['css!css/images-svg.css'],
            callback: function(result) {
                testSucceded = true;
                console.log('SVG support, non retina display: '+ result);
                imageCapabilities.resolve();
            }
        },
        // SVG is not supported, or browser is problematic
        // > load PNG images
        {
            test: !M.svg || !goodBrowser,
            yep: ['css!css/images-url.css'],
            callback: function(result) {
                testSucceded = true;
                console.log('No SVG support or problematic browser: ' + result);
                imageCapabilities.resolve();
            }
        }
    ]);


    $.when(imageCapabilities).done(function() {

        if (!testSucceded) {
             M.load('css/images-url.css');
        }

        var defaults = {
            api: {
                url: '../test/json/test-generated.json'
            },
            options: {
                debug: true,
                showEdgeMarkers: true
            },
            behaviour: {
                keyboard: {
                    eventNavigation: true
                },
                point: {
                    centerOnOpen: true
                }
            },
            map: {
                minZoom: 2,
                maxZoom: 10,
                locations: {
                    center: {
                        coords: [-42, 147],
                        zoom: 6
                    }
                },
                tileSet: {
                    url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    apiKey: false,
                    retinaUrl: false,
                    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
                }
            },
            selectors: {
                mapContainer: '#shipping-map .map-container',
                map: '#map',
                menu: {
                    trigger: '.menu-trigger',
                    container: '.menu-container',
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
            style: {
                point: {
                    default: {
                        radius: 8,
                        fillColor: "white",
                        color: "green",
                        weight: 12,
                        opacity: 1,
                        fillOpacity: 0.8
                    }
                },
                icon: {
                    default: "fa-dot-circle-o",
                    events: {
                        "noon-update": "fa-circle",
                        "noon": "fa-circle",
                        "extended": "fa-dot-circle-o",
                        "ship-event": "fa-dot-circle-o",
                        "image": "fa-certificate",
                        "featured-event": "fa-certificate"
                    },
                    map: {
                        className: "",
                        iconUrl: "",
                        shadowUrl: "",
                        iconSize: [100, 100],
                        shadowSize: [0, 0],
                        iconAnchor: [50, 50],
                        shadowAnchor: [0, 0],
                        popupAnchor: [-3, 0]
                    },
                    menu: {
                        className: "",
                        iconSize: [40, 40],
                        "shadowSize": [0, 0],
                        "iconAnchor": [20, 20]
                    }
                },
                path: {
                    default: {
                        offset: 0,
                        repeat: '6px',
                        pixelSize: 2,
                        pathOptions: {
                            color: "#fff",
                            weight: 2
                        }
                    },
                    future: {
                        offset: 0,
                        repeat: '6px',
                        pixelSize: 2,
                        pathOptions: {
                            color: "#ccc",
                            weight: 2
                        }
                    }
                }
            }
        },
        $document = $(document),
            jPM,
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

                // paths can have their own styles based on period
                if (typeof style.path[path.properties.period.identifier] !== 'undefined') {
                    pattern.pathStyle = style.path[path.properties.period.identifier];
                } else {
                    // or they can use the default style
                    pattern.pathStyle = style.path.default;
                }

                pattern.pathStyle.className = className;

                pattern.offset = pattern.pathStyle.offset;
                pattern.repeat = pattern.pathStyle.repeat;

                pattern.symbol = new L.Symbol.Dash(pattern.pathStyle);

                return pattern;
            };

        $document.ready(function() {
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
                    map = L.map(config.selectors.map.replace('#', ''), {
                        keyboard: config.behaviour.keyboard.eventNavigation ? false : true,
                        reuseTiles: true,
                    }).setView(config.map.locations.center.coords, config.map.locations.center.zoom),
                    $map = $(config.selectors.map);

                /* @todo Parse GET parameters to override json. Security? */

                $('html').addClass('zoom-' + config.map.locations.center.zoom);

                // Prepare side menu templates
                templates.menu.ship = $.templates(config.selectors.templates.menu.ship);
                templates.menu.feature = $.templates(config.selectors.templates.menu.feature);

                // Prepare popup templates
                templates.popup.feature = $.templates(config.selectors.templates.popup.feature);


                // Add tile layer
                L.tileLayer(config.map.tileSet.url, {
                    attribution: config.map.tileSet.attribution,
                    apiKey: config.map.tileSet.apiKey,
                    minZoom: config.map.minZoom,
                    maxZoom: config.map.maxZoom
                }).addTo(map);



                /* ================================================================
                 *
                 * Iterate over each ship and prepare layer data
                 *
                 */
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
                    popups = [],
                        style = $.extend(true, $.extend(true, {}, config.style), ship.style);


                    /* =============================================================
                     *
                     * Featured Events
                     *
                     * Adds each of this ship's interactive feature to the map
                     *
                     */

                    $.each(ship.geojson.features, function(index, f) {

                        // Add this feature to the map
                        var feature,
                            iconString,
                            type = {
                                identifier: makeSafeForCSS(f.properties.type.identifier),
                                name: f.properties.type.name,
                                icon: ''
                            };

                        if (typeof f.properties.type.icon === 'string') {
                            // if this feature has a string as properties.type.icon,
                            // it overrides the default icon type for this feature
                            iconString = f.properties.type.icon;
                        } else {

                            if (typeof style.icon.events[f.properties.type.identifier] !== "undefined") {
                                // else if this feature type has a unique icon, use that
                                iconString = style.icon.events[f.properties.type.identifier];
                            } else {
                                // finally, fall back to the default icon
                                iconString = style.icon.default;
                            }
                        }

                        type.icon = iconString;

                        feature = L.geoJson(f, {
                            style: style.point.default,
                            // Adds each point feature as a circle marker with its
                            // specific style
                            pointToLayer: function(feature, latlng) {
                                var icon = false,
                                    iconStyle = typeof style.point[f.properties.type.identifier] !== "undefined" ? style.point[f.properties.type.identifier] : style.point.default;

                                // Point marker
                                if (index < len - 1) {
                                    // Standard event marker,
                                    // @todo Switch based on type
                                    previous = latlng;

                                    // FontAwesome icon string
                                    icon = L.SimpleMarkers.icon({
                                        icon: iconString,
                                        iconColor: iconStyle.color
                                    });

                                } else {
                                    // Last marker in the array, so show the ship icon

                                    // Show this element on the edge of the screen
                                    // if out of visible bounds
                                    f.properties.edgeMarker = style.icon.menu;

                                    // Show right facing icon if ship is moving east
                                    if (previous.lng && previous.lng < latlng.lng) {
                                        console.warn('@todo - face ships in direction of travel');
                                        style.icon.map.iconUrl = style.icon.map.iconUrl.replace('_100.', '_100_right.');
                                    }

                                    style.icon.map.className = 'ship-icon ' + style.icon.map.className;

                                    icon = L.divIcon(style.icon.map);
                                }

                                f.properties.icon = icon;

                                return L.marker(latlng, {
                                    icon: icon
                                });
                            },
                            // Set popup content
                            onEachFeature: function(feature, layer) {

                                popups[index] = layer.bindPopup(templates.popup.feature.render({
                                    index: index,
                                    ship: ship,
                                    shipIcon: style.icon.menu.iconUrl,
                                    extraClasses: feature.properties.image.src.length ? 'image' : false,
                                    feature: feature.properties,
                                    humanTime: timeString(feature.properties.timestamp),
                                    next: (index < len - 1) ? index + 1 : false,
                                    prev: (index > 0) ? index - 1 : false
                                }), {
                                    maxWidth: 588,
                                    closeButton:false
                                });

                            }
                        }).addTo(map);

                        // If a feature of this type has not been added yet
                        if ($.grep(layers.data.features.types, function(item) {
                            return item.identifier === type.identifier;
                        }).length < 1) {
//                        console.log(i + '.' + j + ' data.features.' + type.identifier);

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

                        if (index < len - 1) {
                            features.data[type.identifier].push(feature);
                        }


                    }); // End ship.geojson.features

                    /* =============================================================
                     *
                     * Ship Paths
                     *
                     * Adds each path type to the map
                     *
                     */
                    $.each(ship.geojson.paths, function(unused, path) {

                        var polylineDecorator,
                            coords = [];
//                        period = {
//                            identifier: makeSafeForCSS(path.properties.period.identifier),
//                            name: path.properties.period.name
//                        };

                        $.each(path.coordinates, function(unused, lnglat) {
                            // geojson coordinate system is the reverse of leaflet default
                            coords.push([lnglat[1], lnglat[0]]);
                        });

//                        polylineDecorator = L.polylineDecorator(L.polyline(coords), {
//                            patterns: [buildPattern(path, style, 'ship-' + ship.shipID)]
//                        });

    console.log(style.path.default.pathOptions);
                        path = L.polyline(coords, style.path.default.pathOptions);

                        // Store this path for toggling on and off
                        layers.data.all.push(path);

                    }); // End ship.geojson.paths

                    // Create the layerGroup which controls this entire ship
                    layers.groups.all = L.layerGroup(layers.data.all);

                    // Add this ship's layerGroup to the map
                    map.addLayer(layers.groups.all);
                    console.log(ship.shipID);
                    // Store relevant variables for toggling from menu
                    ships[ship.shipID] = {
                        layers: layers,
                        popups: popups,
                        name: ship.name,
                        nameSimple: ship.nameSimple,
                        id: ship.shipID,
                        style: style
                    };

                    // Build ship submenu
                    /* @todo Should this really be built in javascript, or in the backend? */
                    $shipsMenu.append(templates.menu.ship.render({
                        name: ship.name,
                        simpleName: ship.nameSimple,
                        icon: style.icon.menu.iconUrl,
                        className: style.icon.menu.className,
                        id: ship.shipID
                    }));

                    console.log(' <=== End ' + ship.name);

                }); // End each ship

                // Store ship data in DOM data
                $map.data('ships', ships);

                /*
                 * Build feature layer groups
                 */

                // For each feature type, we need to build a submenu item, and create its layerGroup
                $.each(features.data.types, function(unused, type) {

                    // Render submenu
                    /* @todo Should this really be built in javascript, or in the backend? */
                    $featuresMenu.append(templates.menu.feature.render({
                        name: type.name,
                        type: type.identifier,
                        icon: type.icon
                    }));

                    /* Although the ships[n].groups.all object contains these features, and
                     * has already been added to the map, we need to add the features
                     * layerGroups as well, else we can't toggle them on and off */
                    features.groups[type.identifier] = L.layerGroup(features.data[type.identifier]).addTo(map);
                });

                /*
                 * Register sidemenu SHIPS button event handlers
                 */
                $document.on('click', '.map-menu .ships button', function(e) {

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

                            $.each(features.data.types, function(unused, type) {
                                if ($('button[data-feature-type="' + type.identifier + '"]').hasClass('hideLayer')) {
                                    // This is a bit of a hack isn't it....
                                    map.addLayer(features.groups[type.identifier])
                                        .removeLayer(features.groups[type.identifier]);
                                }
                            });

                            map.fire('shiptoggle');
                        }

                    } else if ($this.hasClass('toggleMenu')) {
                        $this.toggleClass('closed').next().toggleClass('close');
                    } else {
                        console.warn('Unhandled');
                    }

                });


                /*
                 * Register sidemenu FEATURES button event handlers
                 */
                $document.on('click', '.map-menu .features button', function(e) {

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

                function tryOpeningPopup(ship, index) {
                    if (ship.popups[index]) {
//                        console.log(ship.popups[index]);
                        map.panTo(ship.popups[index]._latlng, {
                            animate:true,
                            duration:1000
                        });
//                        return true;
                        return ship.popups[index].openPopup()._map;
                    }
                }

                function eventNavigation(direction) {
                    var $this = $('.ship-popup'),
                        ship = ships[$this.attr('data-ship-id')],
                        index = $this.attr('data-ship-event-index'),
                        length = ship.popups.length;

                    switch (direction) {
                        case 'prev':
                            while (index >= 0) {
                                if (tryOpeningPopup(ship, --index)) {
                                    break;
                                }
                            }
                            break;
                        case 'next':
                            while (index < length) {
                                if (tryOpeningPopup(ship, ++index)) {
                                    break;
                                }
                            }
                            break;
                    }
                }


                /*
                 * Event next/prev navigation within ship series
                 */
                $document.on('click', '.ship-popup button', function(e) {
                    eventNavigation($(this).attr('data-direction'));
                });

                /*
                 * Next / prev event navigation by keypress
                 */
                if (config.behaviour.keyboard.eventNavigation) {

                    $document.keydown(function(e) {
                        // If left arrow (37) or right arrow (39) was pressed
                        if (e.which === 37 || e.which === 39) {
                            e.preventDefault();
                            eventNavigation(e.which === 37 ? 'prev' : 'next');
                        }
                    });
                }

                /*
                 * Center on popup when it opens
                 */
                if (config.behaviour.point.centerOnOpen) {
                    map.on('popupopen', function(e) {

                        var point = map.options.crs.latLngToPoint(e.popup._latlng, e.popup._map._zoom);

                        /**
                         * @todo Offset point to allow room for popup height
                         */
                        map.panTo(map.options.crs.pointToLatLng(L.point(point.x, point.y - 150), e.popup._map._zoom));
                    });
                }

                /*
                 * Scale ship map icons to suit zoom level
                 */
                function resizeShips(scale) {
                    if (isNaN(scale)) {
                        return;
                    }

                    $('.ship-icon').each(function() {

                        var $this = $(this);

                        $.each(['width', 'height', 'margin-left', 'margin-top'], function(i, prop) {
                            if (!$this.data(prop)) {
                                $this.data(prop, $this.css(prop).replace('px', ''));
                            }
                            $this.css(prop, $this.data(prop) * scale * scale);
                        });

                        $map.data('iconScale', scale);
                    });
                }

                map.on('zoomstart zoomend load resize shiptoggle', function(e) {
                    var scale,
                        defaultZoom = config.map.locations.center.zoom;

                    switch (e.type) {
                        case 'load':
                        case 'resize':
                            scale = e.target._zoom / defaultZoom;
                            break;
                        case 'zoomstart':
                        case 'zoomend':
                            scale = e.target._animateToZoom / defaultZoom;
                            break;
                        case 'shiptoggle':
                            scale = $map.data('iconScale');
                            break;
                        default:
                            scale = 1;
                    }

                    // Store for use on toggle
                    $map.data('iconScale', scale);

                    resizeShips(scale);
                });


                /* Add edge markers to offscreen icons
                 * @todo style icons to suit
                 */
                if (config.options.showEdgeMarkers) {
                    L.edgeMarker({radius: 50, fillColor: 'white'}).addTo(map);
                }

                $document.on('click', '.close-button', function() {
                   map.closePopup();
                });


                if (config.options.debug) {
                    // Show coordinates on click
//                map.on('click', function(e) {
//                    L.popup()
//                        .setLatLng(e.latlng)
//                        .setContent("You clicked the map at " + e.latlng.toString())
//                        .openOn(map);
//                });
                }

                /*
                 * @todo style loading animation
                 */
                setTimeout(function() {
                    $mapHolder.addClass('show');
                }, 1000);

                /*
                 * Initalise jRespond with breakpoints
                 */
                var jRes = jRespond([
                    {
                        label: 'oldmobile',
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

                /*
                 * Initalise jPanelMenu sidemenu map controls
                 */
                jPM = $.jPanelMenu({
                    menu: config.selectors.menu.container,
                    trigger: config.selectors.menu.trigger,
                    excludedPanelContent: '.map-header, .map-footer, style, script',
                    direction: 'right',
                    closeOnContentClick: false,
                    keyboardShortcuts: false,
                    openPosition: config.breakpoint.oldmobile + 'px',
                    beforeOpen: function() {
                        $('.jPanelMenu-panel').addClass('narrow');
                    },
                    afterOpen: function() {
                        $(config.selectors.menu.trigger).addClass('active');
                        // Tell leaflet the map size has changed
                        map.invalidateSize();
                    },
                    beforeClose: function() {
                        $('.jPanelMenu-panel').removeClass('narrow');
                    },
                    afterClose: function() {
                        // Tell leaflet the map size has changed
                        $(config.selectors.menu.trigger).removeClass('active');
                        map.invalidateSize();
                    }
                });

                // Initialise jPanelMenu now that the templates have been built
                jPM.on();

                // Automatically show panel menu at large screen sizes,
                // and hide at small sizes
                jRes.addFunc([{
                        breakpoint: ['handheld'],
                        enter: function() {
                            $('body').addClass('handheld');
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

            }).fail(function(e) {
                console.error('Error fetching ' + defaults.api.url, e);
            });  // End $.getJSON



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
    });


}(jQuery, L, Modernizr));

