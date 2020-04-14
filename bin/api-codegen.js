#!/usr/bin/env node
const fs = require('fs');
const yaml = require('js-yaml');
const {default: codegen} = require('../dist/codegen.js');

const badArgv = (x, code=1) => {
  console.error(`\x1b[1;31mError: ${x}\x1b[0m`);
  console.error([
    'Usage: api-codegen <apiDocPath> [flags]',
    'Flags:',
    '  -o --outputDir: outputDir',
    '  -s --stateTSPath: ctx.state type definition file path',
  ].join('\n'));
  process.exit(code);
};
const errExit = (x, err, code=1) => {
  console.error(`\x1b[1;31mError: ${x}\x1b[0m`);
  if (err) console.error(err);
  process.exit(code);
};

const argAttrs = ['apiDocPath'];
const flag2attr = {
  o: 'outputDir',
  outputDir: 'outputDir',
  s: 'stateTSPath',
  stateTSPath: 'stateTSPath',
};
const requiredAttrs = [
  ...argAttrs,
];
function parseArgv(argv) {
  const argAttrLs = [...argAttrs];
  const config = {};
  let flag0 = null;
  let attr = null;

  const setFlag = flag => {
    flag0 = flag;
    const attr0 = flag2attr[flag];
    if (attr0 == null) return badArgv(`Unknown flag: ${flag}`);
    if (config[attr0] != null) return badArgv(`Duplicate flag: ${flag}`);
    attr = attr0;
  };
  const setVal = val => {
    if (attr == null) {
      const attr0 = argAttrLs.shift();
      if (attr0 == null) return badArgv(`Unexpected token: ${val}`);
      config[attr0] = val;
    } else {
      config[attr] = val;
      attr = null;
    }
  };

  for (const arg of argv) {
    if (arg.startsWith('-')) {
      if (arg.length == 1) {
        return badArgv(`Unexpected token: -`);
      } else if (arg[1] == '-') {
        // flag name
        setFlag(arg.substring(2));
      } else {
        // flag name + para
        setFlag(arg[1]);
        if (arg.length > 2) setVal(arg.substring(2));
      }
    } else { // val
      setVal(arg);
    }
  }
  // check
  if (attr != null) return badArgv(`Expect value for flag: ${flag0}`);
  for (const attr of requiredAttrs) {
    if (!config[attr]) return badArgv(`${attr} is required`);
  }
  return config;
}

async function miku() {
  const config = parseArgv(process.argv.slice(2));
  const {apiDocPath} = config;
  let sAPI;
  try {
    sAPI = fs.readFileSync(apiDocPath).toString();
  } catch (err) {
    return errExit(`Fail to read api doc with path: ${apiDocPath}`, err);
  }
  let api;
  if (apiDocPath.endsWith('.json')) {
    try {
      api = JSON.parse(sAPI);
    } catch (err) {
      return errExit('Invalid JSON file', err);
    }
  } else if (apiDocPath.match(/\.ya?ml$/)) {
    try {
      api = yaml.load(sAPI);
    } catch (err) {
      return errExit('Invalid YAML file', err);
    }
  } else {
    return errExit(`Unknown file type: ${apiDocPath}`);
  }
  // TODO
  const openAPI = api;
  return codegen(openAPI, config);
}
miku()
  .then(() => console.log('\x1b[1;96mDONE\x1b[0m'))
  .catch(err => errExit('Fail to codegen', err));
