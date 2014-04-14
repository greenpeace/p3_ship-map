/**
 *
 * @version
 * @source https://github.com/funkygibbing/Leaflet.EdgeMarker
 * @param {type} L
 * @returns {undefined}
 */
(function(L, $) {
    'use strict';

    L.EdgeMarker = L.Class.extend({
        options: {
            radius: 30,
            weight: 1,
            color: 'white',
            fillColor: 'white',
            fillOpacity: 1,
            className: 'edgeMarker',
            wrapperClassName: 'edgeMarkerCircle',
            transitionClass: 'quickFadeOut'
        },
        timer: false,
        delay: 100,
        initialize: function(options) {
            L.setOptions(this, options);
        },
        addTo: function(map) {
            var timer = false;
            this._map = map;

            //add a method to get applicable features
            L.extend(map, {
                _getFeatures: function() {
                    var out = [];
                    for (var l in this._layers) {
                        if (typeof this._layers[l].getLatLng !== 'undefined') {
                            out.push(this._layers[l]);
                        }
                    }
                    return out;
                }
            });

            map.on('move', function() {
                var that = this;

                if (typeof this._borderMarkerLayer !== 'undefined') {
                    $('.' + this.options.className).addClass(this.options.transitionClass);
                    $('.' + this.options.wrapperClassName).addClass(this.options.transitionClass);
                }

                if (timer) {
                    clearTimeout(timer);
                }

                timer = setTimeout(function() {
                    that._addEdgeMarkers();
                }, that.delay);

            }, this);

            map.on('viewreset', function() {
                var that = this;

                if (typeof this._borderMarkerLayer !== 'undefined') {
                    this._borderMarkerLayer.clearLayers();
                }

                if (timer) {
                    clearTimeout(timer);
                }

                timer = setTimeout(function() {
                    that._addEdgeMarkers();
                }, that.delay);
            }, this);

            this._addEdgeMarkers();

            map.addLayer(this);

            return this;
        },
        onAdd: function() {
        },
        _borderMarkerLayer: false,
        _addEdgeMarkers: function() {
            if (!this._borderMarkerLayer) {
                this._borderMarkerLayer = new L.LayerGroup();
            }
            this._borderMarkerLayer.clearLayers();

            var features = this._map._getFeatures(),
                markerDiv = false,
                markerIcon = false,
                that = this;

            $.each(features, function(i, feature) {
                var f = feature.feature;
                if (typeof f === 'undefined') {
                    return;
                }
                if (typeof f.properties.edgeMarker !== "undefined") {

                    var icon = $.extend(true, {className: that.options.className + 'edgeMarker'}, f.properties.edgeMarker),
                        latlng = feature.getLatLng(),
                        currentMarkerPosition = that._map.latLngToContainerPoint(latlng),
                        mapPixelBounds = that._map.getSize(),
                        divClassName = 'edgeMarkerCircle';

                    icon.className += ' edgeMarker';

                    if (currentMarkerPosition.y < 0 ||
                        currentMarkerPosition.y > mapPixelBounds.y ||
                        currentMarkerPosition.x > mapPixelBounds.x ||
                        currentMarkerPosition.x < 0) {

                        var y = currentMarkerPosition.y,
                            x = currentMarkerPosition.x,
                            x_offset = icon.iconSize[0] / 2.2,
                            y_offset = icon.iconSize[1] / 2.2;

                        if (currentMarkerPosition.y < 0) {
                            y = 0;
                            icon.iconAnchor[1] = icon.iconAnchor[1] - y_offset;
                            divClassName += ' edgetop';
                        } else if (currentMarkerPosition.y > mapPixelBounds.y) {
                            y = mapPixelBounds.y;
                            icon.iconAnchor[1] = icon.iconAnchor[1] + y_offset;
                            divClassName += ' edgebottom';
                        }

                        if (currentMarkerPosition.x > mapPixelBounds.x) {
                            x = mapPixelBounds.x;
                            icon.iconAnchor[0] = icon.iconAnchor[0] + x_offset;
                            divClassName += ' edgeright';
                        } else if (currentMarkerPosition.x < 0) {
                            x = 0;
                            icon.iconAnchor[0] = icon.iconAnchor[0] - x_offset;
                            divClassName += ' edgeleft';
                        }

                        if (typeof f.properties.icon === 'object') {
                            markerDiv = L.marker(that._map.containerPointToLatLng([x, y]), {
                                icon: L.divIcon({
                                    className: divClassName,
                                    iconSize: [that.options.radius * 2, that.options.radius * 2],
                                    html: '<div class="outer"><div class="icon ' + icon.className+ '"></div></div>'
                                })
                            }).addTo(that._borderMarkerLayer);

                            markerDiv.on('click', function() {
                                that._map.panTo(latlng, {animate: true});
                            });

                        } else {
                            markerIcon = L.circleMarker(that._map.containerPointToLatLng([x, y]), that.options)
                                .addTo(that._borderMarkerLayer);

                            markerIcon.on('click', function(e) {
                                that._map.panTo(latlng, {animate: true});
                            });
                        }
                    }
                }
            });

            if (!this._map.hasLayer(this._borderMarkerLayer)) {
                this._borderMarkerLayer.addTo(this._map);
            }

            $('.' + this.options.className).on('mouseenter', function() {
                $(this).addClass('over');
            }).on('mouseleave', function() {
                $(this).removeClass('over');
            });
        }

    });

    L.edgeMarker = function(options) {
        return new L.EdgeMarker(options);
    };

}(L, jQuery));
