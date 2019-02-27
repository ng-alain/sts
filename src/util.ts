import extend from 'extend';
import { Schema } from 'swagger-schema-official';
import { FullSchemaDefinition, GenType, RunOptions } from './interfaces';

const refPrefix = `#/definitions/`;

export function getDefinitionName(ref: string): string {
  return ref.substr(refPrefix.length);
}

export function removeXml(property: Schema) {
  delete property.xml;
}

export function getCustomProperty(type: GenType, name: string, options: RunOptions): any {
  const cog = type === 'st' ? options.config.st : options.config.sf;
  const ls = cog!.properties!.filter(w => w.name === name);
  if (ls.length === 0) {
    return null;
  }
  const pathLs = ls.filter(w => !!w.path && w.path === options.path);
  if (pathLs.length > 0) {
    return pathLs[0].value as Schema;
  }
  return ls[0].value as Schema;
}

export function findSchemaDefinition($ref: string, definitions: FullSchemaDefinition) {
  const match = /^#\/definitions\/(.*)$/.exec($ref);
  if (match && match[1]) {
    // parser JSON Pointer
    const parts = match[1].split('/');
    let current: any = definitions;
    for (let part of parts) {
      part = part.replace(/~1/g, '/').replace(/~0/g, '~');
      if (current.hasOwnProperty(part)) {
        current = current[part];
      } else {
        console.error(`Could not find a definition for ${$ref}.`);
        return null;
      }
    }
    return current;
  }
  console.error(`Could not find a definition for ${$ref}.`);
  return null;
}

export function mergeDefinitions(schema: Schema, definitions: FullSchemaDefinition) {
  const res: { [key: string]: Schema } = {};
  deepEach(schema, (key: string, value: string) => {
    if (key === '$ref') {
      res[getDefinitionName(value)] = findSchemaDefinition(value as string, definitions) as Schema;
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

export function deepCopy(obj: any): any {
  const result = extend(true, {}, { _: obj });
  return result._;
}

export function deepMergeKey(original: any, ingoreArray: boolean, ...objects: any[]): any {
  if (Array.isArray(original) || typeof original !== 'object') return original;

  const isObject = (v: any) => typeof v === 'object' || typeof v === 'function';

  const merge = (target: any, obj: any) => {
    Object.keys(obj)
      .filter(key => key !== '__proto__' && Object.prototype.hasOwnProperty.call(obj, key))
      .forEach(key => {
        const oldValue = obj[key];
        const newValue = target[key];
        if (!ingoreArray && Array.isArray(newValue)) {
          target[key] = [...newValue, ...oldValue];
        } else if (
          oldValue != null &&
          isObject(oldValue) &&
          newValue != null &&
          isObject(newValue)
        ) {
          target[key] = merge(newValue, oldValue);
        } else {
          target[key] = deepCopy(oldValue);
        }
      });
    return target;
  };

  objects.filter(v => isObject(v)).forEach(v => merge(original, v));

  return original;
}

export function deepMerge(original: any, ...objects: any[]): any {
  return deepMergeKey(original, false, ...objects);
}
