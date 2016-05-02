var path = require('path')

module.exports = function (done) {
  try {
    done(null, require(path.resolve(process.cwd(), 'package.json')))
  } catch (e) {
    done(e)
  }
}
