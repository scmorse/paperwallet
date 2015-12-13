"use strict";

var crypto = require('crypto');
var wif = require('wif');

var args = process.argv;

if (args.length < 3 || ['generate', 'decrypt'].indexOf(args[2]) < 0) {
  console.error('Need to specify generate/decrypt as the third parameter');
  process.exit(1);
}

var method = args[2];

if ('generate' === method && args.length !== 7) {
  console.error('need to specify password, private key, address, and amount');
  process.exit(1);
}

if ('decrypt' === method && args.length !== 5) {
  console.error('need to specify password, and encrypted private key');
  process.exit(1);
}

var password = args[3];
var hash = crypto.createHash('sha256').update(password).digest();

function hashXor(other) {
  var res = [];
  for (var i = 0; i < hash.length; i++) {
    res.push(hash[i] ^ other[i]);
  }
  return new Buffer(res);
}

function decrypt(enc) {
  var encBuff = new Buffer(enc, 'hex');
  var decrypted = hashXor(encBuff);
  // This assumes using compressed pub keys, change to false if using uncompressed
  return wif.encode(128, decrypted, true);
}

if ('generate' === method) {
  var fs = require('fs');
  var qr = require('qr-image');
  var swig = require('swig');

  var priv = args[4];
  var address = args[5];
  var amount = args[6];

  var decodedBuff = wif.decode(128, priv).d;
  if (decodedBuff.length !== 32) {
    console.log('priv key not 32 bytes');
    process.exit(1);
  }

  var pseudoEncrypted = hashXor(decodedBuff).toString('hex');
  console.log(pseudoEncrypted);
  console.log(decrypt(pseudoEncrypted));
  if (decrypt(pseudoEncrypted) !== priv) {
    throw new Error("Decryption failed, this shouldn't happen");
  }
  var shortenedAddr = address.substring(0, 8);
  var privPicLoc = 'images/QREncPriv_' + shortenedAddr + '.png';
  var addrPicLoc = 'images/QREncAddr_' + shortenedAddr + '.png';

  var qrPrivPic = qr.image(pseudoEncrypted, { type: 'png', ec_level: 'H', margin: 0});
  qrPrivPic.pipe(fs.createWriteStream('out/' + privPicLoc));

  var qrAddrPic = qr.image(address, { type: 'png', ec_level: 'M', margin: 0 });
  qrAddrPic.pipe(fs.createWriteStream('out/' + addrPicLoc));

  // generate html
  swig.setDefaults({
    autoescape: false
  });
  var rend = swig.renderFile('./wallet.html', {
      PrivTitle: pseudoEncrypted,
      PubTitle: address,
      today: (new Date()).toString(),
      amount: amount,
      privPicLoc: privPicLoc,
      addrPicLoc: addrPicLoc
  });

  // Save html to file
  fs.writeFile('out/' + shortenedAddr + '.html', rend, function(err) {
      if (err) {
          console.log(err);
          return;
      }
      console.log('Success!');
  });
}

if ('decrypt' === method) {
  console.log(decrypt(args[4]));
}