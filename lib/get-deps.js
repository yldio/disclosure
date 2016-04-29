var exec = require('child_process').exec

module.exports = getDeps

function getDeps (cb) {
  exec('npm ls --json true --only prod --depth 5', { cwd: process.cwd() }, function (err, stdout, stderr) {
    if (err || stderr) {
      return cb(err || new Error('Something wrong happened.'))
    }

    try {
      var modl = JSON.parse(stdout)

      return cb(null, modl.dependencies)
    } catch (e) {
      cb(e)
    }
  })
}
