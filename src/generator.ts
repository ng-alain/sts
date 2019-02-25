import * as fs from 'fs';
import { Spec } from 'swagger-schema-official';
const request = require('request');

import { Config, CONFIG, Options, PathConfig, Result } from './interfaces';
import { genSF } from './sf';

function mergeConfig(config?: Config): Config {
  const cog = { ...CONFIG, ...config } as Config;
  if (cog.paths == null) {
    cog.paths = {};
  }
  const paths = cog.paths;
  const newPaths: {
    [path: string]: PathConfig[];
  } = {};
  Object.keys(paths).forEach(key => {
    if (paths[key] == null) {
      paths[key] = [];
    }
    // paths[key]
    //   .filter(i => typeof i.key === 'string')
    //   .forEach(i => {
    //     i.key = new RegExp(i.key);
    //   });

    newPaths[`${cog.pathPrefix || ''}${key}`] = paths[key];
  });
  cog.paths = newPaths;
  return cog;
}

function getSwagger(pathOrUrl: string | Spec, options: any): Promise<Spec | null> {
  return new Promise(resolve => {
    if (typeof pathOrUrl === 'object') {
      return resolve(pathOrUrl as Spec);
    } else if (pathOrUrl.startsWith('http:') || pathOrUrl.startsWith('https:')) {
      return request(pathOrUrl, options, (error: any, response: any, body: string) => {
        resolve(JSON.parse(body));
      });
    } else if (pathOrUrl.trim().startsWith('{')) {
      return resolve(JSON.parse(pathOrUrl));
    } else if (fs.existsSync(pathOrUrl)) {
      return resolve(JSON.parse(fs.readFileSync(pathOrUrl).toString('utf8')));
    } else {
      return resolve(null);
    }
  });
}

export async function generator(
  swaggerJsonPathOrUrl: string | Spec,
  options: Options,
  config?: Config,
): Promise<Result> {
  const cog: Config = mergeConfig(config);
  return new Promise(async (resolve, reject) => {
    const spec = await getSwagger(swaggerJsonPathOrUrl, cog.requestOptions);
    if (spec == null || typeof spec !== 'object') {
      reject(`Not found '${swaggerJsonPathOrUrl}' file or invalid download this file`);
      return;
    }
    resolve({
      spec,
      sf: genSF(spec, options, cog),
      st: null,
    });
  });
}
