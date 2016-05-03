var path = require('path')

module.exports = function (done) {
  var res;

  try {
    res = require(path.resolve(process.cwd(), 'package.json'))
  } catch (e) {
    return done(e)
  }

  done(null, res)
}
