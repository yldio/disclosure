#!/usr/bin/env node

var archy = require('archy')
var chalk = require('chalk')
var Nested = require('../lib/nested')
var exec = require('child_process').exec
var async = require('async')
var charm = require('charm')()
var path = require('path')
var pkg = require('../package.json')
var program = require('commander')
var ora = require('ora')

program
  .version(pkg.version)
  .option('-d, --depth', 'Max display depth of the dependency tree')
  .parse(process.argv)

charm.pipe(process.stdout)
charm.reset()

var spinner = ora({
  text: 'Loading dependencies',
  spinner: 'circleHalves',
  color: 'yellow'
})

getProjectDeps(function (err, viewObj) {
  spinner.start()

  if (err) {
    return handleError(err)
  }

  var deps = new Nested(viewObj.name, viewObj.dependencies)

  async.whilst(
    function () {
      return deps.next()
    },
    function (next) {
      deps.process(next)
    },
    function (err) {
      if (err) {
        return handleError(err)
      }

      spinner.stop()
      charm.write(archy(deps.archyObj))
    }
  )
})

function getProjectDeps (cb) {
  var depthStr = ''

  if (program.depth) {
    depthStr = ' --depth ' + program.depth
  }

  exec('npm ls --json true --only prod' + depthStr, { cwd: process.cwd() }, function (err, stdout, stderr) {
    if (err || stderr) {
      return cb(err || new Error('Something wrong happened.'))
    }

    try {
      var modl = JSON.parse(stdout)

      return cb(null, modl)
    } catch (e) {
      cb(e)
    }
  })
}

function handleError (err) {
  spinner.stop()
  return charm
    .write(err.stack)
    .write('\n')
}
