import * as fs from 'fs';
import * as request from 'request';
import { Spec } from 'swagger-schema-official';

import { Config, CONFIG, Options, Result } from './interfaces';
import { genSF } from './sf';
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
