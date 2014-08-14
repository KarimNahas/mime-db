
var db = {}

// initialize with all the IANA types
require('../src/iana.json').forEach(function (mime) {
  // i don't think the name is useful,
  // and i don't think we need to bother with the "Reference"
  // just look at the site yourself!

  var name = mime[0]
  var template = mime[1]
  // for some reason, references are split into multiple values...
  var type = mime[mime.length - 1]

  if (!template) {
    // some types don't have a template, so we guess it
    console.log('guessing: %s/%s', type, name)
    template = type + '/' + name
  }

  if (!~template.indexOf('/')) {
    // i don't know what templates exactly are,
    // but some aren't valid mime types.
    console.log('prefixing: %s/%s', type, template)
    template = type + '/' + template
  }

  db[template.toLowerCase()] = {}
})

// add the mime extensions from Apache
var mime = require('../src/mime.json')
Object.keys(mime).forEach(function (type) {
  var o = db[type.toLowerCase()] = db[type.toLowerCase()] || {}
  o.extensions = (o.extensions || []).concat(mime[type])
})

// add all of node mime's mime extensions
// though i think we should just put this in `types.json`
var mime = require('../src/node.json')
Object.keys(mime).forEach(function (type) {
  var o = db[type.toLowerCase()] = db[type.toLowerCase()] || {}
  o.extensions = (o.extensions || []).concat(mime[type])
})

// now add all our custom extensions
var mime = require('../lib/extensions.json')
Object.keys(mime).forEach(function (type) {
  var o = db[type.toLowerCase()] = db[type.toLowerCase()] || {}
  o.extensions = (o.extensions || []).concat(mime[type])
})

// add all the compressible metadata
var mime = require('../lib/compressible.json')
Object.keys(mime).forEach(function (type) {
  var o = db[type.toLowerCase()] = db[type.toLowerCase()] || {}
  o.compressible = mime[type].compressible
})

// guess the mime types for the rest of the types
Object.keys(db).forEach(function (name) {
  var mime = db[name]
  if ('compressible' in mime) return
  // text is compressible
  if (/\b(json|text|xml)\b/.test(name)) return mime.compressible = true
  // most media are already compressed
  // or cannot be compressed via gzip
  if (/^(audio|image|video)\//.test(name)) return mime.compressible = false
})

// set the default charsets
var charsets = require('../lib/charsets')
Object.keys(charsets).forEach(function (name) {
  db[name].charset = charsets[name]
})

// guess the charsets
Object.keys(db).forEach(function (name) {
  var mime = db[name]
  if ('charset' in mime) return
  if (/\b(text)\b/.test(name)) mime.charset = 'UTF-8'
})

// alphabetize
var out = {}
Object.keys(db).sort().forEach(function (type) {
  out[type] = db[type]
})

require('fs').writeFileSync('db.json', JSON.stringify(out, null, 2) + '\n')
