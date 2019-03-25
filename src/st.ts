import { Operation, Response, Schema, Spec } from 'swagger-schema-official';
import {
  Config,
  FullSchema,
  FullSchemaDefinition,
  Options,
  ResultValue,
  RunOptions,
  STColumn,
  STColumnType,
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

function propertyToColumn(name: string, property: FullSchema, options: RunOptions): STColumn {
  const res: STColumn = {
    title: getTitle(name, property, options) || name,
    index: getIndex(name, property, options),
  };
  const _type = getType(name, property, options);
  if (_type != null) {
    res.type = _type;
  }
  fixEnum(res, name, property, options);
  fixXml(res, name, property, options);
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

function getType(name: string, property: FullSchema, options: RunOptions): STColumnType | null {
  // https://swagger.io/specification/
  switch (property.type) {
    case 'integer':
    case 'number':
      // 大部分情况下 `id` 并不适合自动右居中，因此 `id` 名称始终为 `string` 类型
      if (name === 'id') {
        return null;
      }
      return 'number';
    case 'boolean':
      return 'yn';
    case 'string':
      switch (property.format) {
        case 'date':
        case 'date-time':
          return 'date';
      }
      break;
  }
  // Identify the type by name
  const nameByType = options.config!.st!.nameToType![name];
  if (nameByType) {
    return nameByType;
  }
  return null;
}

function getIndex(name: string, property: FullSchema, options: RunOptions): string {
  // 若属性包含 $ref，则返回 `name.firstName`
  if (property.$ref && property.$ref.length > 0) {
    return [
      name,
      ...getDeepIndex(property, options.schema.definitions as FullSchemaDefinition),
    ].join('.');
  }
  return name;
}

function getDeepIndex(property: FullSchema, definitions: FullSchemaDefinition): string[] {
  const res: string[] = [];
  const inFn = (p: FullSchema) => {
    if (!p || p.type !== 'object' || !p.properties || Object.keys(p.properties).length === 0) {
      return;
    }
    // 大多数情况下 `id` 并不适合直接呈现给用户
    const validKeys = Object.keys(p.properties).filter(w => w !== 'id');
    res.push(validKeys.length > 0 ? validKeys[0] : Object.keys(p.properties)[0]);
  };
  const subProperty = findSchemaDefinition(property.$ref as string, definitions) as FullSchema;
  inFn(subProperty);
  return res;
}

function fixEnum(column: STColumn, name: string, property: FullSchema, options: RunOptions): void {
  return;
}

function fixXml(column: STColumn, name: string, property: FullSchema, options: RunOptions): void {
  const names = options.config.st!.xmlBlackNames;
  if (!property.xml || !names || names.length === 0) {
    return;
  }
  names.forEach(key => {
    const value = (property.xml as any)[key];
    if (typeof value === 'undefined') return;
    column[key] = value;
  });
}

export function generator(data: Spec, options: Options, config: Config): ResultValue | null {
  const path = `${config.pathPrefix || ''}${options.path}`;
  const method = options.method || config.st!.method || 'get';
  const pathObj = data.paths[path] as any;
  if (pathObj == null || pathObj[method] == null) {
    console.warn(`Not found method [${method}] or [${path}]`);
    return null;
  }
  const oper = pathObj[method] as Operation;
  if (!oper.responses || !oper.responses!['200']) {
    console.warn(`Not found 200 response in [${path},${method}]`);
    return null;
  }
  const successResponse = oper.responses!['200'] as Response;
  // The response body should be the object
  if (!successResponse || !successResponse.schema || successResponse.schema.type !== 'array') {
    console.warn(`Type muse be array schema in [${path},${method},200]`);
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
