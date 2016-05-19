var Table = require('cli-table2')
var chalk = require('chalk')

module.exports = tableReporter

function tableReporter (data) {
  var table = new Table({
    head: [
      chalk.cyan('Module name'),
      chalk.cyan('License'),
      chalk.cyan('SLOC (Weight %)'),
      chalk.cyan('Reliability'),
      chalk.cyan('Vulnerabilities'),
      chalk.cyan('Score')
    ]
  })

  var depsKeys = Object.keys(data)
  var totalSloc = 0

  depsKeys.forEach(function (dep) {
    totalSloc += data[dep].sloc.real
  })

  depsKeys.forEach(function (dep) {
    var crit = data[dep].criteria
    var sloc = data[dep].sloc.real
    var sec = crit.security ? crit.security : false

    if (sec) {
      sec = sec.score ? chalk.green('NONE') : chalk.red('FOUND')
    } else {
      sec = chalk.yellow('?')
    }

    table.push([
      [dep, data[dep].version].join('@'),
      formatLicense(data[dep].license, crit.license.score),
      [sloc, chalk.cyan(parseFloat(((sloc * 100) / totalSloc).toFixed(2)) + ' %')].join(' '),
      formatReliability(crit.reliability.score),
      sec,
      formatScore(data[dep].score)
    ])
  })

  return table.toString()
}

function formatLicense (license, licenseScore) {
  if (!licenseScore) {
    return chalk.red(license)
  }

  return license
}

function formatReliability (num) {
  num *= 100
  var numStr

  if (num >= 0 && num <= 33) {
    numStr = chalk.red('NOT OKAY')
  }

  if (num > 33 && num <= 66) {
    numStr = chalk.yellow('SOME ISSUES')
  }

  if (num > 66) {
    numStr = chalk.green('OKAY')
  }

  return numStr
}

function formatScore (num) {
  num *= 100
  var numStr

  if (num >= 0 && num <= 33) {
    numStr = chalk.red(num + ' %')
  }

  if (num > 33 && num <= 66) {
    numStr = chalk.yellow(num + ' %')
  }

  if (num > 66) {
    numStr = chalk.green(num + ' %')
  }

  return numStr
}
