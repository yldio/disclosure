# Disclosure
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

![demo](https://cloud.githubusercontent.com/assets/6867996/15430360/f663685e-1e9c-11e6-96f9-241c3a8207b4.gif)
## Motivation

The Node.js culture is very active in creating and publishing modules for almost every imaginable need. On average, a Node.js project has a lot more dependencies than in projects with other technologies like .NET or Java. Managing those dependencies can become overwhelming if the project has hard requirements in terms of reliability or legal. There are too many modules to approve, vet, monitor, etc. This tool will give you an overview of a project's dependencies, so you know what you are exposed to regarding licenses, reliability and overall risk.

## Installation
```bash
$ npm i disclosure -g
```

## Usage
```bash
$ disclosure <path>
```

### Options

### `--reporter <reporter>`

The only available reporters at the moment are `table` and `json`. More reporters should follow.


#### _Can I build my own reporter?_
Sure, `disclosure` by default outputs with the `table` reporter, but if you use the `json` reporter you can pipe the stdout to your custom reporter to parse the data and beautify it.

```bash
$ disclosure . --reporter json | my-prettify-module
```

### `--licenses [licenses]`
```bash
$ disclosure . --licenses "MIT,ISC,Apache-2.0"
```

This option lets you pass a custom license whitelist instead of using the [default one](https://github.com/yldio/module-rank/blob/master/lib/licenses-whitelist.js).

> Separate the licenses by comma and use only valid SPDX licenses ids.

### `--licenses-file [licensesFile]`
```bash
$ disclosure . --licenses-file license.json
```

The same functionality as described before but instead uses a file content as the license white list.

## Node.js API

```js
disclosure(projectPath, [options], callback)
```

`projectPath` should be a valid absolute or relative path. An `opts` object may be provided:

```js
var opts = {
  licenses: ['MIT', 'ISC'] // Licenses whitelist - Only valid SPDX licenses ids
}
```

The `callback` will be called with an `Error` and `results` object:

```js
var results = {
  name: '...',
  version: '1.33.7',
  sloc: {
    real: 1234
    pkg: 100
  },
  tests: {
    exists: true,
    framework: true,
    npmScript: true
  },
  license: 'MIT',
  dependencies: {...},
  dependenciesCount: 13,
  isOutdated: false,
  isDeprecated: false,
  vulnerabilities: [...],
  private: false,
  __moduleData: {
    version: '1.0.0',
    type: 'standard'
  }
}
```

## Disclosure core
The disclosure core is two modules that you should definitely check out and those are:

- [`module-data`](https://github.com/yldio/module-data) - Traverse local module data and query remote module data.
- [`module-rank`](https://github.com/yldio/module-rank) - Our rank formula using the data acquired by `module-data`

## Formula breakdown
We have three areas of concern and those are:

- Security
- Reliability
- License

Each has a weight of 1, so each represents roughly 33% of the final score.

### Security
The criteria of `Security` for public modules is:

- `noVuln` - This is an array of objects that comes from [`snyk`](https://snyk.io/).

For private modules, there is no criteria to evaluate.

### Reliability
The criteria of `Reliability` for public modules is:

- `hasTests`
- `isNotOutdated`
- `isNotDeprecated` - If this is `false`, the score of this area of concern is 0.

For private modules is:

- `hasTests`

### License
The criteria of `License` for public and private modules is:

- `hasLicense`
- `licenseOnWhiteList`

> Both need to have a score of 1 to have a positive score or else the final score of this area is 0.
