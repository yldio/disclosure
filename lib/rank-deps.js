var moduleRank = require('module-rank')
var chalk = require('chalk')
var async = require('async')

module.exports = function (archy, done) {
  var traversal = new ArchyTraverser(archy)

  async.whilst(
    function () {
      return traversal.next()
    },
    function (cb) {
      traversal.process(cb)
    },
    function (err) {
      return done(err, traversal.archy)
    }
  )
}

function ArchyTraverser (archy) {
  this.depth = 0
  this.cursor = []
  this.archy = archy
  this.current = archy.nodes
}

ArchyTraverser.prototype.next = function () {
  if (!this.current) {
    return false
  }

  var closestChildWithGrandChilds

  // Check if cursor is empty
  if (this.cursor.length < 1) {
    var childrenIndexes = []
    this.current.forEach(function (dep, index) {
      childrenIndexes.push(index)
    })

    if (childrenIndexes.length < 1) {
      return false
    }

    for (var i = 0; i < childrenIndexes.length; i++) {
      if (closestChildWithGrandChilds) {
        break
      }
      var index = childrenIndexes[i]

      if (this.current[index].nodes.length > 0) {
        closestChildWithGrandChilds = this.current[index]
      }
    }

    this.cursor.push({ nodes: this.current, indexes: childrenIndexes })
  } else {
    var cursorTmp = []

    this.cursor.forEach(function (pos) {
      pos.indexes.forEach(function (i) {
        var childrenIndexes = []

        pos.nodes[i].nodes.forEach(function (dep, index) {
          childrenIndexes.push(index)
        })

        if (childrenIndexes.length > 0) {
          if (!closestChildWithGrandChilds) {
            closestChildWithGrandChilds = pos.nodes[i].nodes
          }

          cursorTmp.push({ nodes: pos.nodes[i].nodes, indexes: childrenIndexes })
        }
      })
    })

    this.cursor = cursorTmp
  }

  this.current = closestChildWithGrandChilds

  this.depth++
  return true
}

ArchyTraverser.prototype.process = function (done) {
  var tasks = []

  this.cursor.forEach(function (pos) {
    pos.indexes.forEach(function (i) {
      tasks.push(createTask(pos.nodes, i))
    })
  })

  async.parallel(tasks, done)

  function createTask (nodeRef, index) {
    return function (done) {
      var dep = nodeRef[index].label
      dep = dep.split('@')

      moduleRank(dep[0], dep[1], function (err, rank) {
        if (err) {
          return done(err)
        }

        var license = rank.license ? chalk.green(rank.license) : chalk.red('UNLICENSED')
        var score = rank.score < 7 ? chalk.red(rank.score) : chalk.green(rank.score)

        // Mutate reference
        nodeRef[index].label = chalk.yellow(dep[0] + '@' + dep[1]) + ' - ' + license + ' - ' + score

        return done()
      })
    }
  }
}
