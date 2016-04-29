#!/usr/bin/env node

var moduleRank = require('module-rank')
var archy = require('archy')
var chalk = require('chalk')
var getProjectDeps = require('../lib/get-deps')
var async = require('async')

getProjectDeps(function (err, deps) {
  if (err) {
    return console.error(err)
  }

  var tree = {}
  var tasks = []

  parseDeps(deps)

  function parseDeps (depsRef) {
    var rootDeps = Object.keys(depsRef)

    rootDeps.forEach(function (dep) {
      tree[dep] = {
        version: deps[dep].version
      }

      if (deps[dep].dependencies) {
        tree[dep].dependencies = parseDeps()
      }

      tasks.push(function (cb) {
        moduleRank(dep, deps[dep].version, function () {

        })
      })
    })
  }
})
