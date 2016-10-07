#!node

const fs = require('fs');
const path = require('path');
const commandLineArgs = require('command-line-args');

const transformer = require('../lib/transformer');

var options = commandLineArgs([
    {
        name: 'from',
        alias: 'f',
        type: String,
        defaultOption: true,
        description: 'The input file to move data from'
    },
    {
        name: 'to',
        alias: 't',
        type: String,
        description: 'The output file to move data'
    },
    {
        name: 'output',
        alias: 'o',
        type: String,
        defaultValue: '-',
        description: 'The output file to save result'
    },
    {
        name: 'mask',
        alias: 'm',
        type: String,
        defaultValue: '',
        description: 'Mask to get props'
    },
    {
        name: 'rx',
        alias: 'r',
        type: String,
        defaultValue: '',
        description: 'RegExp for matching transforming property parts path before move'
    },
    {
        name: 'replace',
        alias: 'l',
        type: String,
        defaultValue: '',
        description: 'String to replace matched property parts with'
    },
    {
        name: 'path',
        alias: 'p',
        type: String,
        defaultValue: '',
        description: 'Path of property to save'
    }
]);

fs.readFile(options.from, 'utf-8', function(err, data) {
    if ( ! data) {
        err = 'file is empty';
    }
    if (err) {
        console.log('err', err);

        return;
    }

    var p_parts = options.mask.split('.*.');
    var chunks = [ { data: JSON.parse(data), path: '' } ];
    var currentChunks;

    if (p_parts.length) {
        const l = p_parts.length;

        p_parts.forEach(function(p, i) {
            currentChunks = [];
            chunks.forEach(function(last) {
                const elem = transformer.safeGet(last.data, p);

                console.error(elem);

                if (elem) {
                    const path = (last.path ? last.path + '.' : '') + p;

                    if (i < l - 1) {
                        currentChunks = currentChunks.concat(Object.keys(elem).map(function(prop) {
                            return {
                                data: elem[prop],
                                path: path + '.`' + prop + '`'
                            };
                        }));
                    } else {
                        currentChunks.push({ data: elem, path: path });
                    }
                }
            });
            chunks = currentChunks;
        });
    } else {
        currentChunks = transformer.get(data, options.mask);
        chunks = [].concat(currentChunks ? {
            data: currentChunks,
            path: options.mask
        } : []);
    }

    fs.readFile(options.to, 'utf-8', function(err, data) {
        if ( ! data) {
            err = 'file is empty';
        }
        if (err) {
            console.log('err', err);

            return;
        }

        var json = JSON.parse(data),
            rx = options.rx,
            replace = options.replace,
            path = options.path,
            output = options.output || options.to;

        chunks.forEach(function(chunk) {
            var chunkPath = chunk.path;

            if (rx && replace) {
                chunkPath = chunkPath.replace(new RegExp(rx), replace);
            } else if (path) {
                chunkPath = path;
            }

            json = transformer.safeSet(json, chunkPath, chunk.data);
        });

        if (output !== '-') {
            fs.writeFile(output, JSON.stringify(json, null, '  '));
        } else {
            process.stdout(JSON.stringify(json, null, '  '))
        }
    });
});
