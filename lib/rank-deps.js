var moduleRank = require('module-rank')
var chalk = require('chalk')

module.exports = Nested

function parseDeps (deps, parent) {
  var depsTree = []

  Object.keys(deps).forEach(function (dep) {
    var tree = {
      data: {
        name: dep,
        version: deps[dep].version
      }
    }

    if (parent) {
      tree.parent = parent
    }

    if (deps[dep].dependencies) {
      // var childrens = parseDeps(deps[dep].dependencies, tree)

      tree.childrens = parseDeps(deps[dep].dependencies, tree)
    }

    depsTree.push(tree)
  })

  return depsTree
}

// Structure example
// {
//    data: {
//    	name: ... ,
//    	version: ... ,
//
//    	// Added along process()
//    	score: .... ,
//    	criteria: ... ,
//    	license: ...
//    }
// 		childrens: [...],
// 		parent: ref,
//
// 		// Added along process()
// 	  parentArchy: ref,
// 	  archy: ref
// }
function Nested (pkgName, deps) {
  this.archyObj = {
    label: pkgName,
    nodes: []
  }
  this.head = {
    childrens: [],
    archy: {
      label: pkgName,
      nodes: []
    }
  }
  this.head.childrens = parseDeps(deps, this.head)

  this.current = this.head.childrens.pop()
  this.current.parentArchy = this.head.archy
}

Nested.prototype.process = function (done) {
  var childrens = this.current.childrens
  var data = this.current.data
  var parentArchy = this.current.parentArchy
  var current = this.current
  moduleRank(data.name, data.version, function (err, rank) {
    if (err) {
      return done(err)
    }

    data.license = rank.license || 'UNLICENSED'
    data.score = rank.score
    data.criteria = rank.criteria

    var licenseArchy = data.license === 'UNLICENSED' ? chalk.red(data.license) : chalk.green(data.license)
    var scoreArchy = data.score < 7 ? chalk.red(data.score) : chalk.green(data.score)
    var lblArchy = chalk.yellow(data.name + '@' + data.version) + ' - ' + licenseArchy + ' - ' + scoreArchy

    if (childrens.length < 1) {
      var currentArchy = {
        label: lblArchy,
        nodes: []
      }

      current.archy = currentArchy
      parentArchy.nodes.push(currentArchy)
    } else {
      parentArchy.nodes.push(lblArchy)
    }

    done()
  })
}

Nested.prototype.next = function () {
  if (!this.current.childrens || this.current.childrens.length < 1) {
    if (this.current.parent) {
      this.current = this.current.parent
      return this.next()
    } else {
      // nested data traversal is over
      return false
    }
  } else {
    // We're at the head
    if (!this.current.parent) {
      this.current = this.head.childrens.pop()
    } else {
      this.current = this.current.parent.childrens.pop()
    }

    this.current.parentArchy = this.current.parent.archy

    return true
  }
}
