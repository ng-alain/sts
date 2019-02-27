import { Schema } from 'swagger-schema-official';

export interface Options {
  path: string;
  /**
   * 指定方法，未指定时默认：
   * - `sf` 为 `put`
   * - `st` 为 `get`
   */
  method?: string;
}

export const CONFIG: Config = {
  pathPrefix: '',
  descriptionIsTitle: true,
  propertyMapNames: {
    id: '编号',
    name: '名称',
    email: '邮箱',
    // status: '状态',
  },
  sf: {
    method: 'put',
    singleArray: {
      type: 'string',
      ui: {
        widget: 'select',
        mode: 'tags',
      },
      default: null,
    },
    properties: [],
  },
  st: {
    method: 'get',
    properties: [],
  },
};

export interface Config {
  /** 请求 swagger JSON 文件[配置项](https://github.com/request/request#requestoptions-callback) */
  requestOptions?: any;
  /** 路径前缀 */
  pathPrefix?: string;
  /**
   * 自定义属性名称映射，默认：
   * ```ts
   * {
   *  id: '编号',
   *  name: '名称',
   *  email: '邮箱',
   *  status: '状态',
   * }
   * ```
   */
  propertyMapNames?: { [name: string]: string };
  /** 指定 `description` 为 `title`，并删除 `description`，默认：`true` */
  descriptionIsTitle?: boolean;
  /** `sf` 配置项 */
  sf?: SFConfig;
  /** `st` 配置项 */
  st?: STConfig;
}

export interface SFConfig {
  /**
   * 指定方法，未指定时默认：
   * - `sf` 为 `put`
   */
  method?: string;
  /** 由于 `sf` 并不支持这种类型，默认被转化为 `select` 小部件 */
  singleArray?: SFSchema;
  /** 自定义属性的 `Schema` */
  properties?: PathConfig[];
}

export interface STConfig {
  /**
   * 指定方法，未指定时默认：
   * - `st` 为 `get`
   */
  method?: string;
  /** 自定义属性的 `Schema` */
  properties?: PathConfig[];
}

export interface PathConfig {
  /**
   * 属性名称，例如：`name`、`email`
   */
  name: string;
  /**
   * 指定路径，若不指定则该属性名对所有 path 有效
   */
  path?: string;
  /**
   * 值分为 `SFSchema` 或 `STColumn` 类型
   */
  value?: SFSchema;
}

export interface SFSchema {
  [key: string]: any;
  //////////// 数值类型 /////////////
  /**
   * 最小值
   */
  minimum?: number;
  /**
   * 约束是否包括 `minimum` 值
   */
  exclusiveMinimum?: boolean;
  /**
   * 最大值
   */
  maximum?: number;
  /**
   * 约束是否包括 `maximum` 值
   */
  exclusiveMaximum?: boolean;
  /**
   * 倍数
   */
  multipleOf?: number;
  //////////// 字符串类型/////////////
  /**
   * 定义字符串的最大长度
   */
  maxLength?: number;
  /**
   * 定义字符串的最小长度
   */
  minLength?: number;
  /**
   * 验证输入字段正则表达式字符串，若指定 `format: 'regex'` 时务必指定
   */
  pattern?: string;
  //////////// 数组类型/////////////
  /**
   * 数组元素类型描述，只支持数组对象，若需要基础类型数组可通过其他部件支持
   *
   * ```json
   * items: {
   *   type: 'object',
   *   properties: {
   *     name: { type: 'string' },
   *     age: { type: 'number' }
   *   }
   * }
   * ```
   *
   * 结果
   *
   * ```json
   * [
   *   { "name": "cipchk1", "age": 18 },
   *   { "name": "cipchk2", "age": 16 }
   * ]
   * ```
   */
  items?: SFSchema;
  /**
   * 约束数组最小的元素个数
   * - `type="array"` 时有效
   */
  minItems?: number;
  /**
   * 约束数组最大的元素个数
   * - `type="array"` 时有效
   */
  maxItems?: number;
  /**
   * 约束数组每个元素都不相同
   * - `type="array"` 时有效
   */
  uniqueItems?: boolean;
  /**
   * 最大属性个数，必须是非负整数
   */
  maxProperties?: number;
  /**
   * 最小属性个数，必须是非负整数
   */
  minProperties?: number;
  /**
   * 必填项属性
   */
  required?: string[];
  /**
   * 定义属性
   */
  properties?: { [key: string]: SFSchema };
  /**
   * 数据格式，[文档](http://json-schema.org/latest/json-schema-validation.html#rfc.section.7.3)
   * - `date-time` 日期时间，渲染为 `date`，[RFC3339](https://tools.ietf.org/html/rfc3339#section-5.6)
   * - `date`、`full-date` 日期，渲染为 `date`
   * - `time`、`full-time` 时间，渲染为 `time`
   * - `email` Email格式，渲染为 `autocomplete`
   * - 非标准：`week`，渲染为 `nz-week-picker`
   * - 非标准：`month`，渲染为 `nz-month-picker`
   * - `ip` IP地址，渲染为 `input`
   * - `uri` URL地址，渲染为 `upload`
   * - `regex` 正则表达式，必须指定 `pattern` 属性，渲染为 `input`
   * - `mobile` 手机号
   * - `id-card` 身份证
   * - `color` 颜色值
   */
  format?: string;
  /**
   * 属性描述，相当于 `label` 值，按以下规则展示：
   * - 当值为 `null`、`undefined` 时使用 `key` 替代
   * - 当值为 `''` 空字符串表示不展示 `label` 部分，例如：`checkbox` 可能需要
   */
  title?: string;
  /**
   * 属性目的性解释，采用 `nz-form-extra` 渲染
   */
  description?: string;
  /**
   * 默认值
   */
  default?: any;
  /**
   * 是否只读状态
   */
  readOnly?: boolean;

  /** **唯一非标准：** 指定UI配置信息，优先级高于 `sf` 组件 `ui` 属性值 */
  ui?: any;
}

export interface Result {
  spec?: any;
  sf?: SFResult | null;
  st?: STResult | null;
}

export interface SFResult {
  [key: string]: any;
}

export interface FullSchema extends Schema {
  definitions?: FullSchemaDefinition;
}

export interface FullSchemaDefinition {
  [definitionsName: string]: FullSchema;
}

export interface STResult {
  [key: string]: any;
}
