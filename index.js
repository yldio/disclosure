var localData = require('module-data').local
var remoteData = require('module-data').remote
var standardizeData = require('module-data/standardize')
var getDepsSet = require('module-data/dependencies-set')
var moduleRank = require('module-rank')
var async = require('async')

module.exports = disclosure

function disclosure (path, options, cb) {
  options = options || {}

  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  localData(path, { depth: 0 }, function (err, local) {
    if (err) {
      return cb(err)
    }

    var depsSet = getDepsSet(local)
    var queries = {}

    Object.keys(depsSet).forEach(function (dep) {
      queries[dep] = getData(dep, depsSet[dep][0])
    })

    return async.parallel(queries, handleRemoteData(local, options, cb))
  })
}

function handleRemoteData (local, options, cb) {
  return function (err, remote) {
    if (err) {
      return cb(err)
    }

    var data = {
      local: local,
      remote: remote
    }

    return mergeData(data, options, cb)
  }
}

function getData (mdlName, version) {
  return function (done) {
    remoteData(mdlName, {version: version}, done)
  }
}

function mergeData (data, options, done) {
  return standardizeData(data, function (err, standardData) {
    if (err) {
      return done(err)
    }

    return moduleRank(standardData, options, done)
  })
}
