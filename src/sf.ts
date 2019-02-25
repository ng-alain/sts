import { BodyParameter, Operation, Schema, Spec } from 'swagger-schema-official';
import { Config, FullSchema, Options, SFResult } from './interfaces';
import { getSchema, mergeDefinitions } from './util';

function optimizationProperyies(_schema: FullSchema, config: Config): FullSchema {
  const inFn = (schema: FullSchema, parentSchema?: FullSchema) => {
    const properties = schema.properties as { [propertyName: string]: Schema };
    Object.keys(properties).forEach(propertyName => {
      const property = properties[propertyName] as FullSchema;
      if (property.properties && Object.keys(property.properties).length) {
        inFn(property, schema);
      }
    });
  };
  inFn(_schema);
  if (_schema.definitions) {
    Object.keys(_schema.definitions).forEach(key => {
      inFn((_schema.definitions as any)[key] as FullSchema);
    });
  }
  return _schema;
}

export function genSF(data: Spec, options: Options, config: Config): SFResult | null {
  const path = `${config.pathPrefix || ''}${options.path}`;
  const mth = options.method || config.sfMethod || 'put';
  const pathObj = data.paths[path] as any;
  if (pathObj == null || pathObj[mth] == null) {
    return null;
  }
  const oper = pathObj[mth] as Operation;
  if (!oper || !oper.parameters || oper.parameters.length <= 0) {
    return null;
  }

  const inBody = oper.parameters.find((w: any) => w.in === 'body') as BodyParameter;
  if (!inBody) {
    return null;
  }

  const schema = getSchema(inBody!.schema!.$ref as string, data.definitions) as FullSchema;
  if (schema == null) {
    return null;
  }

  // Merge all definitions
  const otherDefinitions = mergeDefinitions(schema, data.definitions);
  if (Object.keys(otherDefinitions).length > 0) {
    schema.definitions = otherDefinitions;
  }

  // Optimization property ui
  optimizationProperyies(schema, config);
  console.log(JSON.stringify(schema));

  return null;
}
