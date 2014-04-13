/**!
 * $.p3.request
 *
 * Query string parser, returns the url and an object
 * containing the GET parameters in key: value format
 *
 * Required in most $.p3 libraries
 *
 * @author          <a href="mailto:hello@raywalker.it">Ray Walker</a>
 * @source          https://github.com/greenpeace/p3_styleguide
 * @version         0.1.1
 * @requires        <a href="http://jquery.com/">jQuery</a>
 * @usage           $.p3.request('http://fish.com?type=salmon');
 * @returns         {object} { url: 'http://fish.com', parameters: { type: 'salmon' } }
 */
(function($) {
    'use strict';
    var _p3 = $.p3 || {};

    _p3.request = function(url) {
        var request = {
            url: false,
            parameters: false
        },
        parts = [],
            getRequestParams = function() {
                var params = {};
                parts.shift();
                if (parts[0]) {
                    parts.join('?').split(/[&;]/g).forEach(function(param) {
                        var q = param.split(/\=/);
                        if (q.length > 0 && q[0].length) {
                            params[q[0]] = q[1];
                        }
                    });
                }
                return params;
            },
            getRequestURL = function() {
                return (parts[0].length) ? parts[0] : url;
            };

        if (url) {
            parts = url.split('?');
        } else {
            return request;
        }

        request.url = getRequestURL();
        request.parameters = getRequestParams();

        return request;
    };

    $.p3 = _p3;

}(jQuery));

