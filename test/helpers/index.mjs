import 'crypto';
import * as fs from 'fs';
import { inherits } from 'util';
import { Stream } from 'stream';
import { Readable, Writable } from 'readable-stream';

export function adjustDateByOffset(d, offset) {
  d = (d instanceof Date) ? d : new Date();

  if (offset >= 1) {
    d.setMinutes(d.getMinutes() - offset);
  } else {
    d.setMinutes(d.getMinutes() + Math.abs(offset));
  }

  return d;
}

export function binaryBuffer(n) {
  var buffer = Buffer.alloc(n);

  for (var i = 0; i < n; i++) {
    buffer.writeUInt8(i&255, i);
  }

  return buffer;
}

export function BinaryStream(sizeAsAny, options) {
  Readable.call(this, options);

  var size = sizeAsAny - 0;
  var buf = Buffer.alloc(size);

  for (var i = 0; i < size; i++) {
    buf.writeUInt8(i&255, i);
  }

  this.push(buf);
  this.push(null);
}

inherits(BinaryStream, Readable);

BinaryStream.prototype._read = function(size) {};

export function DeadEndStream(options) {
  Writable.call(this, options);
}

inherits(DeadEndStream, Writable);

DeadEndStream.prototype._write = function(chuck, encoding, callback) {
  callback();
};

export function readJSON(filepath) {
  var contents;

  try {
    contents = fs.readFileSync(String(filepath));
    contents = JSON.parse(contents);
  } catch(e) {
    contents = null;
  }

  return contents;
}

export function UnBufferedStream() {
  this.readable = true;
}

inherits(UnBufferedStream, Stream);

export function WriteHashStream(path, options) {
  fs.WriteStream.call(this, path, options);

  this.hash = crypto.createHash('sha1');
  this.digest = null;

  this.on('close', function() {
    this.digest = this.hash.digest('hex');
  });
}

inherits(WriteHashStream, fs.WriteStream);

WriteHashStream.prototype.write = function(chunk) {
  if (chunk) {
    this.hash.update(chunk);
  }

  return fs.WriteStream.prototype.write.call(this, chunk);
};
