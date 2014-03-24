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