#!/usr/bin/env node

var pkg = require('../package.json')
var program = require('commander')
var path = require('path')
var disclosure = require('../')
var tableReporter = require('../lib/table-reporter')

var reporters = {
  'table': tableReporter,
  'default': defaultDisplay
}
var pathArg

// Parse args path
// Describe program
program
  .version(pkg.version)
  .option('--reporter <reporter>', 'Beatify data with a reporter', selectReporter, 'default')
  .option('--licenses [licenses]', 'Licences whitelist separated by commas')
  .option('--licenses-file [licensesFile]', 'Licences whitelist json file')
  .arguments('<path>')
  .action(function (path) {
    pathArg = path
  })
  .parse(process.argv)

var licenses = program.licenses || program['licenses-files'] || false

var options = {}
if (licenses) {
  options.licenses = licenses
}

disclosure(path.resolve(pathArg), options, function (err, data) {
  if (err) {
    return handleError(err)
  }

  return console.log(reporters[program.reporter](data))
})

function selectReporter (val, def) {
  if (!val) {
    val = def
  }

  if (!~Object.keys(reporters).indexOf(val)) {
    handleError(new Error(val + ' not a valid reporter.'))
    return null
  }

  return val
}

function handleError (err) {
  console.log(err.stack)

  process.exit(1)
}

function defaultDisplay (data) {
  return JSON.stringify(data, null, 2)
}
