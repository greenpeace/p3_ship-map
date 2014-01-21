/**
 *
 * @version
 * @source https://github.com/funkygibbing/Leaflet.EdgeMarker
 * @param {type} L
 * @returns {undefined}
 */
(function(L) {
    'use strict';

    L.EdgeMarker = L.Class.extend({
        options: {
            radius: 30,
            weight: 1,
            color: 'white',
            fillColor: 'white',
            fillOpacity: 1
        },
        initialize: function(options) {
            L.setOptions(this, options);
        },
        addTo: function(map) {
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

            map.on('move', this._addEdgeMarkers, this);
            map.on('viewreset', this._addEdgeMarkers, this);

            this._addEdgeMarkers();

            map.addLayer(this);

            return this;
        },
        onAdd: function() {
        },
        _borderMarkerLayer: undefined,
        _addEdgeMarkers: function() {
            if (typeof this._borderMarkerLayer === 'undefined') {
                this._borderMarkerLayer = new L.LayerGroup();
            }
            this._borderMarkerLayer.clearLayers();

            var features = this._map._getFeatures(),
                marker = undefined;

            for (var i = 0; i < features.length; i++) {

//                console.log(typeof features[i].feature.properties.icon);

                if (features[i].feature.properties.edgeMarker === true) {

                    var latlng = features[i].getLatLng(),
                        currentMarkerPosition = this._map.latLngToContainerPoint(latlng),
                        mapPixelBounds = this._map.getSize();

                    if (currentMarkerPosition.y < 0 ||
                        currentMarkerPosition.y > mapPixelBounds.y ||
                        currentMarkerPosition.x > mapPixelBounds.x ||
                        currentMarkerPosition.x < 0) {

                        var y = currentMarkerPosition.y;
                        if (currentMarkerPosition.y < 0) {
                            y = 0;
                        } else if (currentMarkerPosition.y > mapPixelBounds.y) {
                            y = mapPixelBounds.y;
                        }

                        var x = currentMarkerPosition.x;
                        if (currentMarkerPosition.x > mapPixelBounds.x) {
                            x = mapPixelBounds.x;
                        } else if (currentMarkerPosition.x < 0) {
                            x = 0;
                        }

                        if (typeof features[i].feature.properties.icon === 'object') {
                            L.circleMarker(this._map.containerPointToLatLng([x, y]), this.options)
                                .addTo(this._borderMarkerLayer);

                            marker = L.marker(this._map.containerPointToLatLng([x, y]), { icon: features[i].feature.properties.icon })
                                .addTo(this._borderMarkerLayer);

                        } else {
                            marker = L.circleMarker(this._map.containerPointToLatLng([x, y]), this.options)
                                .addTo(this._borderMarkerLayer);
                        }

                        marker.on('click', function (e, wtf) {
//                            console.log(e);
//                            console.log(wtf);
                            this._map.setView(e.latlng, this._map.getZoom(), { animate: true });
                        });

                    }
                }


            }
            if (!this._map.hasLayer(this._borderMarkerLayer)) {
                this._borderMarkerLayer.addTo(this._map);
            }
        }
    });

    L.edgeMarker = function(options) {
        return new L.EdgeMarker(options);
    };

})(L);
