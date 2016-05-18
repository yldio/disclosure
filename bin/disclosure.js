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
var path = require('path')

var pathArg

// Parse args path
// Describe program
program
  .version(pkg.version)
  .arguments('<path>')
  .action(function (path) {
    pathArg = path
  })
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
      chalk.cyan('SLOC (Weight)'),
      chalk.cyan('Score')
    ]
  })

  var depsKeys = Object.keys(data)
  var totalSloc = 0

  depsKeys.forEach(function (dep) {
    totalSloc += data[dep].sloc.real
  })

  depsKeys.forEach(function (dep) {
    var crit = data[dep].criteria
    var sloc = data[dep].sloc.real

    table.push([
      [dep, data[dep].version].join('@'),
      colorLicense(data[dep].license, crit.license.score),
      colorPercentage(crit.reliability.score),
      colorPercentage(crit.security.score),
      sloc + ' (' + parseFloat(((sloc * 100) / totalSloc).toFixed(2)) + ')',
      colorPercentage(data[dep].score)
    ])
  })

  charm
    .write(table.toString())
    .write('\n')
}

function colorLicense (license, licenseScore) {
  if (!licenseScore) {
    return chalk.red(license)
  }

  return license
}

function colorPercentage (num) {
  num *= 100

  if (num >= 0 && num <= 33) {
    num = chalk.red(num + '%')
  }

  if (num > 33 && num <= 66) {
    num = chalk.yellow(num + '%')
  }

  if (num > 66) {
    num = chalk.green(num + '%')
  }

  return num
}

function getData (mdlName, version) {
  return function (done) {
    remoteData(mdlName, {version: version}, done)
  }
}
