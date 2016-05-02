module.export = function (pkgName, deps, done) {
  done(null, {
    label: pkgName,
    nodes: parseDeps(deps)
  })
}

function parseDeps (depsTree) {
  var nodeRef = Object.keys(depsTree)

  nodeRef = nodeRef.map(function (dep) {
    var tmp = {
      label: dep,
      nodes: []
    }

    if (Object.keys(depsTree[dep]).length > 0) {
      tmp.nodes = parseDeps(depsTree[dep])
    }

    return tmp
  })

  return nodeRef
}
