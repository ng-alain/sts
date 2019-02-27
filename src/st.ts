import { Operation, Response, Schema, Spec } from 'swagger-schema-official';
import {
  Config,
  FullSchema,
  FullSchemaDefinition,
  Options,
  ResultValue,
  RunOptions,
  STColumn,
} from './interfaces';
import { findSchemaDefinition, getCustomProperty, mergeDefinitions, removeXml } from './util';

function coverColumns(options: RunOptions): STColumn[] {
  const res: STColumn[] = [];
  const eachCallback = options.config!.st!.propertyCallback;
  const inFn = (schema: FullSchema, parentSchema?: FullSchema) => {
    const properties = schema.properties as { [propertyName: string]: Schema };
    Object.keys(properties).forEach(propertyName => {
      const property = properties[propertyName] as FullSchema;
      const column = propertyToColumn(propertyName, property, options);
      if (column == null) {
        return;
      }

      Object.assign(column, getCustomProperty('st', propertyName, options));
      res.push(column);

      if (eachCallback) {
        eachCallback({
          name: propertyName,
          property,
          column,
          path: options.path,
          method: options.method,
        });
      }
    });
  };

  inFn(options.schema);
  return res;
}

function propertyToColumn(
  name: string,
  property: FullSchema,
  options: RunOptions,
): STColumn | null {
  const res: STColumn = {
    title: getTitle(name, property, options) || name,
    index: name,
  };
  const type = getType(name, property, options);
  if (type != null) {
    res.type = type as any;
  }
  return res;
}

function getTitle(name: string, property: FullSchema, options: RunOptions): string {
  if (property.title != null) {
    return property.title;
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
  }
  return property.title as string;
}

function getType(name: string, property: FullSchema, options: RunOptions): string | null {
  return null;
}

export function generator(data: Spec, options: Options, config: Config): ResultValue | null {
  const path = `${config.pathPrefix || ''}${options.path}`;
  const method = options.method || config.st!.method || 'get';
  const pathObj = data.paths[path] as any;
  if (pathObj == null || pathObj[method] == null) {
    return null;
  }
  const oper = pathObj[method] as Operation;
  if (!oper || !oper.responses || !oper.responses!['200']) {
    return null;
  }
  const successResponse = oper.responses!['200'] as Response;
  // The response body should be the object
  if (
    !successResponse ||
    !successResponse.schema ||
    successResponse.schema.type !== 'array' ||
    !(successResponse.schema!.items as Schema)!.$ref
  ) {
    return null;
  }

  const schema = findSchemaDefinition(
    (successResponse.schema!.items as Schema)!.$ref as string,
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

  const columns = coverColumns(runOpt);

  const finishedCallback = config!.st!.finishedCallback;
  if (finishedCallback) {
    finishedCallback({ columns, path, method });
  }

  return columns;
}
