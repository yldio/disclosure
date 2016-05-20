# Disclosure
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

![demo](https://cloud.githubusercontent.com/assets/6867996/15426687/e20a768c-1e87-11e6-8e55-8eeb58eb0e5f.gif)
## Motivation

The node.js culture is very active in creating and publishing modules for almost every imaginable need. Therefore, on average a node.js project has a lot more dependencies than a .NET or Java project. Managing those dependencies can become a nightmare real quick when the project has specific needs, such as legal or reliability. There is to much modules to approve, for vetting, to monitor, etc. We need a tool to give us an overview of the project's dependencies, so we may know what are we exposed to at a legal level, reliability level and overall risk.

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

The only available reporter at the moment is `table`. More reporters should follow.

#### `table`
```bash
$ disclosure --reporter table .
```

#### _Can I build my own reporter?_
Sure, `disclosure` by default outputs JSON. So you can pipe the stdout to your custom reporter.

```bash
$ disclosure . | my-prettify-module
```

### `--licenses [licenses]`
```bash
$ disclosure . --licenses "MIT,ISC,Apache-2.0"
```

This option let you pass a custom license whitelist instead of using the [default one](https://github.com/yldio/module-rank/blob/master/lib/licenses-whitelist.js).

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
