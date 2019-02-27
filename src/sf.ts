import { BodyParameter, Operation, Schema, Spec } from 'swagger-schema-official';
import {
  Config,
  FullSchema,
  FullSchemaDefinition,
  Options,
  SFResult,
  SFSchema,
} from './interfaces';
import { findSchemaDefinition, mergeDefinitions } from './util';

interface RunOptions {
  path: string;
  method: string;
  config: Config;
  schema: FullSchema;
}

function optimizationProperyies(options: RunOptions): FullSchema {
  const inFn = (schema: FullSchema, parentSchema?: FullSchema) => {
    const properties = schema.properties as { [propertyName: string]: Schema };
    removeXml(schema);
    Object.keys(properties).forEach(propertyName => {
      const property = properties[propertyName] as FullSchema;
      fixDefaultProperty(propertyName, property, options);
      Object.assign(property, getCustomProperty(propertyName, options) as Schema);
      // removed xml
      removeXml(property);
      // children
      if (property.properties && Object.keys(property.properties).length) {
        inFn(property, schema);
      }
    });
  };

  inFn(options.schema);
  if (options.schema.definitions) {
    Object.keys(options.schema.definitions).forEach(key => {
      inFn((options.schema.definitions as any)[key] as FullSchema);
    });
  }
  return options.schema;
}

function removeXml(property: Schema) {
  delete property.xml;
}

function fixDefaultProperty(
  name: string,
  property: FullSchema,
  options: RunOptions,
): SFSchema | null {
  // format
  fixFormat(name, property, options);
  // Title
  fixTitle(name, property, options);
  // Fix single item array
  fixSingleArray(property, options);

  return null;
}

function getDefaultFormatByName(name: string): string {
  switch (name) {
    case 'email':
    case 'mobile':
    case 'id-card':
    case 'color':
      return name;
  }
  return '';
}

function fixFormat(name: string, property: SFSchema, options: RunOptions): void {
  if (property.format == null) {
    property.format = getDefaultFormatByName(name);
  }
  if (property.format.length === 0) {
    delete property.format;
  }
  // removed: int32, int64
  if (property.format === 'int32' || property.format === 'int64') {
    delete property.format;
    if (property.type !== 'integer' || property.type !== 'number') {
      property.type = 'number';
    }
  }
}

function fixTitle(name: string, property: SFSchema, options: RunOptions): void {
  if (property.title != null) {
    return;
  }

  const defaultTitle = options.config!.propertyMapNames![name];
  if (defaultTitle) {
    property.title = defaultTitle;
  }

  if (
    property.title == null &&
    property.description != null &&
    property.description.length > 0 &&
    options.config.descriptionIsTitle === true
  ) {
    property.title = property.description;
    delete property.description;
  }
}

function fixSingleArray(property: SFSchema, options: RunOptions): void {
  if (property.type !== 'array' || !property.items) {
    return;
  }
  const keys = Object.keys(property.items);
  if (keys.includes('$ref')) {
    return;
  }
  if (keys.includes('type')) {
    Object.assign(property, options.config.sf!.singleArray);
    delete property.items;
  }
}

function getCustomProperty(name: string, options: RunOptions): Schema | null {
  const ls = options.config.sf!.properties!.filter(w => w.name === name);
  if (ls.length === 0) {
    return null;
  }
  const pathLs = ls.filter(w => !!w.path && w.path === options.path);
  if (pathLs.length > 0) {
    return pathLs[0].value as Schema;
  }
  return ls[0].value as Schema;
}

export function genSF(data: Spec, options: Options, config: Config): SFResult | null {
  const path = `${config.pathPrefix || ''}${options.path}`;
  const method = options.method || config.sf!.method || 'put';
  const pathObj = data.paths[path] as any;
  if (pathObj == null || pathObj[method] == null) {
    return null;
  }
  const oper = pathObj[method] as Operation;
  if (!oper || !oper.parameters || oper.parameters.length <= 0) {
    return null;
  }

  const inBody = oper.parameters.find((w: any) => w.in === 'body') as BodyParameter;
  if (!inBody) {
    return null;
  }

  const schema = findSchemaDefinition(
    inBody!.schema!.$ref as string,
    data.definitions as FullSchemaDefinition,
  ) as FullSchema;
  if (schema == null) {
    return null;
  }

  // Merge all definitions
  const otherDefinitions = mergeDefinitions(schema, data.definitions as FullSchemaDefinition);
  if (Object.keys(otherDefinitions).length > 0) {
    schema.definitions = otherDefinitions;
  }

  const runOpt: RunOptions = {
    path,
    method,
    config,
    schema,
  };

  // Optimization property ui
  optimizationProperyies(runOpt);

  return schema;
}
