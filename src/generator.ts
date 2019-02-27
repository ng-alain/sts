import * as fs from 'fs';
import * as request from 'request';
import { Spec } from 'swagger-schema-official';

import { Config, CONFIG, Options, Result } from './interfaces';
import { generator as genSF } from './sf';
import { generator as genST } from './st';
import { deepMerge } from './util';

function getSwagger(pathOrUrl: string | Spec, options: any): Promise<Spec | null> {
  return new Promise(resolve => {
    if (typeof pathOrUrl === 'object') {
      return resolve(pathOrUrl as Spec);
    } else if (pathOrUrl.startsWith('http:') || pathOrUrl.startsWith('https:')) {
      return request.get(pathOrUrl, options, (error: any, response: any, body: string) => {
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
  const cog = deepMerge({}, CONFIG, config || {}) as Config;
  if (options.type == null) {
    options.type = 'sf';
  }
  return new Promise(async (resolve, reject) => {
    const spec = await getSwagger(swaggerJsonPathOrUrl, cog.requestOptions);
    if (spec == null || typeof spec !== 'object') {
      reject(`Not found '${swaggerJsonPathOrUrl}' file or invalid download this file`);
      return;
    }

    const value = options.type === 'st' ? genST(spec, options, cog) : genSF(spec, options, cog);

    resolve({ spec, value });
  });
}
