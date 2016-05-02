var npmRemoteLs = require('npm-remote-ls').ls
var async = require('async')
var StdOutFixture = require('fixture-stdout')

// Configure npm-remote-ls module
require('npm-remote-ls').config({
  development: false,
  optional: false
})

module.exports = function (maxDepth) {
  return function (pkg, done) {
    var tasks = []
    var rootDeps = pkg.dependencies

    Object.keys(rootDeps).forEach(function (dep) {
      tasks.push(createTask(dep))
    })

    // NOTE:
    // We need to capture a specific write to stdout
    // because package 'npm-remote-ls' doesn't follow
    // node.js callback error-first pattern and it
    // doesn't thrown an error as well, it writes to
    // stdout
    var fixture = new StdOutFixture()
    fixture.capture(function (str) {
      if (str.match(/could not find a satisfactory version for/g)) {
        throw new Error(str.replace('\n', ''))
      }

      return false
    })
    fixture.isCapturing = true
    process.on('uncaughtException', catchException)

    async.parallel(tasks, function (err, res) {
      if (err) {
        return done(err)
      }

      // Merge results into a single object
      var deps = {}
      res.forEach(function (depTree) {
        var rootDep = Object.keys(depTree)[0]
        deps[rootDep] = depTree[rootDep]
      })

      // This will reduce the 'deps'
      // depth according to maxDepth
      handleObjDepth(deps)

      // Clean up
      fixture.release()
      process.removeListener('uncaughtException', catchException)

      return done(null, deps)
    })

    // ---- Start definitions ----
    function createTask (dep) {
      return function (next) {
        npmRemoteLs(dep, pkg.dependencies[dep], function (depsTree) {
          next(null, depsTree)
        })
      }
    }

    function catchException (err) {
      if (fixture.isCapturing) {
        fixture.release()
      }

      return done(err)
    }

    function handleObjDepth (obj, depth, cursor) {
      depth = depth || 0
      cursor = cursor || []

      if (depth > maxDepth + 1) {
        cursor.forEach(function (pos) {
          pos.keys.forEach(function (key) {
            delete pos.obj[key]
          })
        })
      } else {
        if (!obj) {
          return
        }

        depth++
        var closestChildWithGrandChilds

        // Check if cursor is empty
        if (cursor.length < 1) {
          var childrenKeys = Object.keys(obj)

          if (childrenKeys.length < 1) {
            return
          }

          for (var i = 0; i < childrenKeys.length; i++) {
            if (closestChildWithGrandChilds) {
              break
            }
            var key = childrenKeys[i]

            if (Object.keys(obj[key]).length > 0) {
              closestChildWithGrandChilds = obj[key]
            }
          }

          cursor.push({obj: obj, keys: childrenKeys})
        } else {
          var cursorTmp = []

          cursor.forEach(function (pos) {
            pos.keys.forEach(function (key) {
              var childrenKeys = Object.keys(pos.obj[key])

              if (childrenKeys.length > 0) {
                if (!closestChildWithGrandChilds) {
                  closestChildWithGrandChilds = pos.obj[key]
                }

                cursorTmp.push({ obj: pos.obj[key], keys: childrenKeys })
              }
            })
          })

          cursor = cursorTmp
        }

        handleObjDepth(closestChildWithGrandChilds, depth, cursor)
      }
    }

    // ---- End definitions ----
  }
}
