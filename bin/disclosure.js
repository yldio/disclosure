#!/usr/bin/env node

var async = require('async')
var charm = require('charm')()
var pkg = require('../package.json')
var program = require('commander')
var ora = require('ora')
var localData = require('module-data').local
var remoteData = require('module-data').remote
var standardizeData = require('module-data/standardize')
var getDepsSet = require('module-data/dependencies-set')
var moduleRank = require('module-rank')
var Table = require('cli-table2')
var chalk = require('chalk')

// Parse args path
// Describe program
program
  .version(pkg.version)
  .arguments('<path>')
  .parse(process.argv)

// Handle stdout and clean terminal
charm.pipe(process.stdout)
charm.reset()

// Create loading spinner
var spinner = ora({
  text: 'Loading dependencies',
  spinner: 'circleHalves',
  color: 'yellow'
})

spinner.start()

localData(process.cwd(), {depth: 0}, function (err, local) {
  if (err) {
    return console.log(err.stack)
  }

  var depsSet = getDepsSet(local)
  var queries = {}

  Object.keys(depsSet).forEach(function (dep) {
    queries[dep] = getData(dep, depsSet[dep][0])
  })

  return async.parallel(queries, handleRemoteData(local))
})

function handleRemoteData (local) {
  return function (err, remote) {
    spinner.stop()

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
  charm
    .write(err.stack)
    .write('\n')
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

  var table = new Table({
    head: [
      chalk.cyan('Module name'),
      chalk.cyan('License'),
      chalk.cyan('Reliability'),
      chalk.cyan('Security'),
      chalk.cyan('SLOC (Weight)')
    ]
  })

  // TODO missing table.push
}

function getData (mdlName, version) {
  return function (done) {
    remoteData(mdlName, {version: version}, done)
  }
}
