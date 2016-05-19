#!/usr/bin/env node

var async = require('async')
var pkg = require('../package.json')
var program = require('commander')
var localData = require('module-data').local
var remoteData = require('module-data').remote
var standardizeData = require('module-data/standardize')
var getDepsSet = require('module-data/dependencies-set')
var moduleRank = require('module-rank')
var path = require('path')
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
  .option('--licenses-file [licensesFile]', 'Licences whitelist json')
  .arguments('<path>')
  .action(function (path) {
    pathArg = path
  })
  .parse(process.argv)

localData(path.resolve(pathArg), {depth: 0}, function (err, local) {
  if (err) {
    return handleError(err)
  }

  var depsSet = getDepsSet(local)
  var queries = {}

  Object.keys(depsSet).forEach(function (dep) {
    queries[dep] = getData(dep, depsSet[dep][0])
  })

  return async.parallel(queries, handleRemoteData(local))
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

function handleRemoteData (local) {
  return function (err, remote) {
    if (err) {
      return handleError(err)
    }

    var data = {
      local: local,
      remote: remote
    }

    return mergeData(data, displayData)
  }
}

function handleError (err) {
  console.log(err.stack)

  process.exit(1)
}

function mergeData (data, done) {
  return standardizeData(data, function (err, standardData) {
    if (err) {
      return done(err)
    }

    return moduleRank(standardData, done)
  })
}

function displayData (err, data) {
  if (err) {
    return handleError(err)
  }

  console.log(reporters[program.reporter](data))
}

function defaultDisplay (data) {
  return JSON.stringify(data, null, 2)
}

function getData (mdlName, version) {
  return function (done) {
    remoteData(mdlName, {version: version}, done)
  }
}
