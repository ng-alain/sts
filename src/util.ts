import { Schema } from 'swagger-schema-official';

const refPrefix = `#/definitions/`;

export function getDefinitionName(ref: string): string {
  return ref.substr(refPrefix.length);
}

export function getSchema(ref: string, def?: { [definitionsName: string]: Schema }): Schema | null {
  if (!ref || ref.length <= refPrefix.length || !def) {
    return null;
  }
  return def[getDefinitionName(ref)] || null;
}

export function mergeDefinitions(schema: Schema, def?: { [definitionsName: string]: Schema }) {
  const res: { [key: string]: Schema } = {};
  deepEach(schema, (key: string, value: string) => {
    if (key === '$ref') {
      res[getDefinitionName(value)] = getSchema(value as string, def) as Schema;
    }
  });
  return res;
}

export function deepEach(obj: any, cb: (key: string, value: any) => void): void {
  const inFn = (o: any) => {
    Object.keys(o).forEach(key => {
      if (typeof o[key] === 'object') {
        inFn(o[key]);
      } else {
        cb(key, o[key]);
      }
    });
  };
  inFn(obj);
}
