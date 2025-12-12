/**
 * archiver-utils
 *
 * Copyright (c) 2015 Chris Talkington.
 * Licensed under the MIT license.
 * https://github.com/archiverjs/archiver-utils/blob/master/LICENSE
 */
import fs from 'graceful-fs';
import path from 'path';
import { default as isStreamInternal } from 'is-stream';
import lazystream from 'lazystream';
import { default as normalizePath } from 'normalize-path';
import { PassThrough } from 'readable-stream';
export * as file from './file.mjs';

export function collectStream(source, callback) {
  var collection = [];
  var size = 0;

  source.on('error', callback);

  source.on('data', function(chunk) {
    collection.push(chunk);
    size += chunk.length;
  });

  source.on('end', function() {
    var buf = Buffer.alloc(size);
    var offset = 0;

    collection.forEach(function(data) {
      data.copy(buf, offset);
      offset += data.length;
    });

    callback(null, buf);
  });
};

export function dateify(dateish) {
  dateish = dateish || new Date();

  if (dateish instanceof Date) {
    dateish = dateish;
  } else if (typeof dateish === 'string') {
    dateish = new Date(dateish);
  } else {
    dateish = new Date();
  }

  return dateish;
};

// this is slightly different from lodash version
export function defaults(object, source, guard) {
  var args = arguments;
  args[0] = args[0] || {};

  return Object.assign.apply({}, args);
};

export function isStream(source) {
  return isStreamInternal(source);
}

export function lazyReadStream(filepath) {
  return new lazystream.Readable(function() {
    return fs.createReadStream(filepath);
  });
};

export function normalizeInputSource(source) {
  if (source === null) {
    return Buffer.alloc(0);
  } else if (typeof source === 'string') {
    return Buffer.from(source);
  } else if (isStream(source)) {
    // Always pipe through a PassThrough stream to guarantee pausing the stream if it's already flowing,
    // since it will only be processed in a (distant) future iteration of the event loop, and will lose
    // data if already flowing now.
    return source.pipe(new PassThrough());
  }

  return source;
};

export function sanitizePath(filepath) {
  return normalizePath(filepath, false).replace(/^\w+:/, '').replace(/^(\.\.\/|\/)+/, '');
};

export function trailingSlashIt(str) {
  return str.slice(-1) !== '/' ? str + '/' : str;
};

export function unixifyPath(filepath) {
  return normalizePath(filepath, false).replace(/^\w+:/, '');
};

export function walkdir(dirpath, base, callback) {
  var results = [];

  if (typeof base === 'function') {
    callback = base;
    base = dirpath;
  }

  fs.readdir(dirpath, function(err, list) {
    var i = 0;
    var file;
    var filepath;

    if (err) {
      return callback(err);
    }

    (function next() {
      file = list[i++];

      if (!file) {
        return callback(null, results);
      }

      filepath = path.join(dirpath, file);

      fs.stat(filepath, function(err, stats) {
        results.push({
          path: filepath,
          relative: path.relative(base, filepath).replace(/\\/g, '/'),
          stats: stats
        });

        if (stats && stats.isDirectory()) {
          walkdir(filepath, base, function(err, res) {
	    if(err){
	      return callback(err);
	    }

            res.forEach(function(dirEntry) {
              results.push(dirEntry);
            });
		  
            next();  
          });
        } else {
          next();
        }
      });
    })();
  });
};
