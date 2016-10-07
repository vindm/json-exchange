/**
 * @type {RegExp}
 */
var arrayItemTmplRx = /\[([^:\]]*)(?::([^\]]*))?\]/;

/**
 * @type {String}
 */
var esc = '`';

/**
 * @param {*} root
 * @param {String} path
 * @param {*} [defaultValue]
 * @returns {*}
 */
function safeGet(root, path, defaultValue) {
    var value = root;

    if (path.indexOf(esc) !== -1) {
        var rx = new RegExp('(?:' + esc + '([^' + esc + ']*?)' + esc + ')|(?:(?:\\.|^)([^\\.' + esc + ']*))', 'g');
        var chain = [];
        var part;

        while (part = rx.exec(path)) {
            if (part[0] !== path) {
                part = part[2] || part[1] || part[0];
                part === '.' || (chain.push(part.replace(new RegExp('(^' + esc + ')|(' + esc + '$)', 'g'), '')));
            } else {
                chain.push(path);
            }
        }
    } else {
        chain = path.split('.');
    }

    var isNotFound = chain.some(function(prop) {
        if (typeof value === 'undefined' || value === null) {
            return true;
        }

        if (Array.isArray(value)) {
            var tmpl = prop.match(arrayItemTmplRx);

            if (tmpl && tmpl[1]) {
                value.some(function(elem, i) {
                    if (typeof elem === 'undefined' || elem === null) {
                        return false;
                    }

                    var hasProp = elem.hasOwnProperty(tmpl[1]);

                    if (elem === tmpl[1] || (hasProp && (! tmpl[2] || elem[tmpl[1]] === tmpl[2]))) {
                        prop = i;

                        return true;
                    }
                });
            }
        }

        if (! value.hasOwnProperty(prop)) {
            return true;
        }

        value = value[prop];

        return false;
    });

    return isNotFound ? defaultValue : value;
}

/**
 * @param {*} root
 * @param {String} path
 * @param {*} value
 * @returns {*}
 */
function safeSet(root, path, value) {
    if (path.indexOf('`') !== -1) {
        var rx = new RegExp('(?:' + esc + '([^' + esc + ']*?)' + esc + ')|(?:(?:\\.|^)([^\\.' + esc + ']*))', 'g');
        var chain = [];
        var part;

        while (part = rx.exec(path)) {
            if (part[0] !== path) {
                part = part[2] || part[1] || part[0];
                part === '.' || (chain.push(part.replace(new RegExp('(^' + esc + ')|(' + esc + '$)', 'g'), '')));
            } else {
                chain.push(path);
            }
        }
    } else {
        chain = path.split('.');
    }

    for (var i = 0, length = chain.length, ctx = root; i < length; i++) {
        if (typeof ctx === 'undefined' || ctx === null) {
            break;
        }

        var prop = chain[i];

        if (Array.isArray(ctx)) {
            var tmpl = prop.match(arrayItemTmplRx);

            if (tmpl && tmpl[1]) {
                ctx.some(function(elem, j) {
                    if (typeof elem === 'undefined' || elem === null) {
                        return false;
                    }

                    var hasProp = elem.hasOwnProperty(tmpl[1]);

                    if (elem === tmpl[1] || (hasProp && (! tmpl[2] || (elem[tmpl[1]] === tmpl[2])))) {
                        prop = j;

                        return true;
                    }
                }) || (prop = ctx.length);
            }
        }

        if (i === length - 1) {
            ctx[prop] = value;
        } else {
            if (! ctx.hasOwnProperty(prop)) {
                var nextProp = chain[i + 1];

                ctx[prop] = isNaN(nextProp) && ! nextProp.match(/\\[.*?\\]/) ? {} : [];
            }

            ctx = ctx[prop];
        }
    }

    return root;
}

module.exports = {
    safeGet: safeGet,
    safeSet: safeSet
};
