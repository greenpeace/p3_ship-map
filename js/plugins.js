// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

/**
 * Makes a string safe for css attributes in html
 *
 * @source http://stackoverflow.com/questions/7627000/javascript-convert-string-to-safe-class-name-for-css
 * @todo Check if this is international character friendly
 * @param {string} name
 * @returns {string} CSS safe string
 */
function makeSafeForCSS(name) {
    if (typeof name === 'undefined') {
        return 'undefined';
    }
    return name.toLowerCase().replace(/[^a-z0-9]/g, function(s) {
        var c = s.charCodeAt(0);
        if (c === 32){
            return '-';
        }
        if (c >= 65 && c <= 90) {
            return '_' + s.toLowerCase();
        }
        return '__' + ('000' + c.toString(16)).slice(-4);
    });
}