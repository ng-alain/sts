#!/usr/bin/env node

import * as fs from 'fs';
import meow from 'meow';
import * as path from 'path';
import { generator } from './generator';
import { Config, Options } from './interfaces';

const cli = meow({
  help: `
  Usage
    ng-alain-sts <Swagger JSON file path>
  Example
    ng-alain-sts -p=/pet swagger.json
  Options
    -p, --path    Specified path, e.g: '/api/pet', '/pet'
    -m, --method  Specified method type, e.g: get, post, default: get
    -c, --config  A filepath of your config script
                  Example of a config script: https://github.com/cipchk/vscode-snippet-generator-tpl/blob/master/snippet-config.json
  `,
  flags: {
    path: {
      type: 'string',
      alias: 'p',
    },
    method: {
      type: 'string',
      default: 'get',
      alias: 'm',
    },
    config: {
      type: 'string',
      default: 'swagger-config.json',
      alias: 'c',
    },
  },
});

const options = {
  ...cli.flags,
} as Options;

const { config } = cli.flags;
let configInFile: Config = {};

try {
  const configFile = path.resolve(process.cwd(), config);
  if (fs.existsSync(configFile)) {
    configInFile = require(configFile);
  } else {
    console.error(`The config file '${config}' will not found`);
    process.exit(1);
  }
} catch (err) {
  console.error('Invalid config file', err);
  process.exit(1);
}

generator('', options, configInFile);
