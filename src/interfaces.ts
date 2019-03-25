import { Schema, Spec } from 'swagger-schema-official';

// #region cli

export type GenType = 'sf' | 'st';

export interface Options {
  type?: GenType;
  path: string;
  /**
   * 指定方法，未指定时默认：
   * - `sf` 为 `put`
   * - `st` 为 `get`
   */
  method?: string;
}

// #endregion

// #region Config

export const CONFIG: Config = {
  pathPrefix: '',
  descriptionIsTitle: true,
  propertyMapNames: {
    id: '编号',
    name: '名称',
    email: '邮箱',
    status: '状态',
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
    nameToType: {
      price: 'currency',
      amount: 'currency',
      num: 'number',
      count: 'number',
      avatar: 'img',
      mp: 'img',
      modified: 'date',
      created: 'date',
    },
    xmlBlackNames: ['i18n'],
    properties: [],
  },
};

export interface Config {
  /** Swagger JSON 文件[网络请求配置项](https://github.com/request/request#requestoptions-callback) */
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

// #endregion

// #region Result

export interface Result {
  spec: Spec;
  value: ResultValue | ResultValue[] | null;
}

export interface ResultValue {
  [key: string]: any;
}

// #endregion

// #region sf, st Config

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
  value?: SFSchema | STColumn;
}

export interface SFPropertyCallbackOptions {
  name: string;
  property: Schema;
  path: string;
  method: string;
}

export interface SFFinishedCallbackOptions {
  schema: Schema;
  path: string;
  method: string;
}

export interface SFConfig {
  /**
   * 指定默认方法名，默认：`put`
   */
  method?: string;
  /** 由于 `sf` 并不支持这种类型，默认被转化为 `select` 小部件 */
  singleArray?: SFSchema;
  /** 自定义属性的 `Schema` */
  properties?: PathConfig[];
  /**
   * XML 属性白名单，这些信息会以优先级最高直接传递给 `ui`
   */
  xmlBlackNames?: string[];
  /** 递归属性回调 */
  propertyCallback?: (optinos: SFPropertyCallbackOptions) => void;
  /** 完成时回调 */
  finishedCallback?: (options: SFFinishedCallbackOptions) => void;
}

export interface STPropertyCallbackOptions {
  name: string;
  property: Schema;
  column: STColumn;
  path: string;
  method: string;
}

export interface STFinishedCallbackOptions {
  columns: STColumn[];
  path: string;
  method: string;
}

export interface STConfig {
  /**
   * 指定默认方法名，默认：`get`
   */
  method?: string;
  /** 自定义属性的 `Schema` */
  properties?: PathConfig[];
  /**
   * 根据名称自定义类型，例如：
   * - `price` => `currency`
   */
  nameToType?: { [name: string]: STColumnType };
  /**
   * XML 属性白名单，这些信息会以优先级最高直接传递给 `STColumn`，默认：`['i18n']`
   */
  xmlBlackNames?: string[];
  /** 递归属性回调 */
  propertyCallback?: (optinos: STPropertyCallbackOptions) => void;
  /** 完成时回调 */
  finishedCallback?: (options: STFinishedCallbackOptions) => void;
}

// #endregion

// #region running

export interface RunOptions {
  path: string;
  method: string;
  config: Config;
  schema: FullSchema;
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

export interface FullSchema extends Schema {
  definitions?: FullSchemaDefinition;
  ui?: { [key: string]: any };
}

export interface FullSchemaDefinition {
  [definitionsName: string]: FullSchema;
}

export type STColumnType =
  | 'checkbox'
  | 'link'
  | 'badge'
  | 'tag'
  | 'radio'
  | 'img'
  | 'currency'
  | 'number'
  | 'date'
  | 'yn'
  | 'no';

export interface STColumn {
  [key: string]: any;

  /**
   * 用于定义数据源主键，例如：`STStatistical`
   */
  key?: string;
  /**
   * 列标题
   */
  title: string;
  /**
   * 列标题 i18n
   */
  i18n?: string;
  /**
   * 列数据在数据项中对应的 key，支持 `a.b.c` 的嵌套写法，例如：
   * - `id`
   * - `price.market`
   * - `[ 'price', 'market' ]`
   */
  index?: string | string[];
  /**
   * 类型
   * - `no` 行号，计算规则：`index + noIndex`
   * - `checkbox` 多选
   * - `radio` 单选
   * - `link` 链接，务必指定 `click`
   * - `badge` [徽标](https://ng.ant.design/components/badge/zh)，务必指定 `badge` 参数配置徽标对应值
   * - `tag` [标签](https://ng.ant.design/components/tag/zh)，务必指定 `tag` 参数配置标签对应值
   * - `img` 图片且居中(若 `className` 存在则优先)
   * - `number` 数字且居右(若 `className` 存在则优先)
   * - `currency` 货币且居右(若 `className` 存在则优先)
   * - `date` 日期格式且居中(若 `className` 存在则优先)，使用 `dateFormat` 自定义格式
   * - `yn` 将`boolean`类型徽章化 [document](https://ng-alain.com/docs/data-render#yn)
   */
  type?: STColumnType;
  /**
   * 按钮组
   */
  buttons?: Array<{ [key: string]: any }>;
  /**
   * 数字格式，`type=number` 有效
   */
  numberDigits?: string;
  /**
   * 日期格式，`type=date` 有效，（默认：`YYYY-MM-DD HH:mm`）
   */
  dateFormat?: string;
  /**
   * 当 `type=yn` 有效
   */
  yn?: STColumnYn;
  /** 当不存在数据时以默认值替代 */
  default?: string;
  /**
   * 徽标配置项
   */
  badge?: STColumnBadge;
  /**
   * 标签配置项
   */
  tag?: STColumnTag;
}

/** 当 `type=yn` 有效 */
export interface STColumnYn {
  /**
   * 真值条件，（默认：`true`）
   */
  truth?: any;
  /**
   * 徽章 `true` 时文本，（默认：`是`）
   */
  yes?: string;
  /**
   * 徽章 `false` 时文本，（默认：`否`）
   */
  no?: string;
}

/**
 * 徽标信息
 */
export interface STColumnBadge {
  [key: number]: STColumnBadgeValue;
  [key: string]: STColumnBadgeValue;
}

export interface STColumnBadgeValue {
  /**
   * 文本
   */
  text?: string;
  /**
   * 徽标颜色值
   */
  color?: 'success' | 'processing' | 'default' | 'error' | 'warning';
}

/**
 * 标签信息
 */
export interface STColumnTag {
  [key: number]: STColumnTagValue;
  [key: string]: STColumnTagValue;
}

export interface STColumnTagValue {
  /**
   * 文本
   */
  text?: string;
  /**
   * 颜色值，支持预设和色值
   * - 预设：geekblue,blue,purple,success,red,volcano,orange,gold,lime,green,cyan
   * - 色值：#f50,#ff0
   */
  color?:
    | 'geekblue'
    | 'blue'
    | 'purple'
    | 'success'
    | 'red'
    | 'volcano'
    | 'orange'
    | 'gold'
    | 'lime'
    | 'green'
    | 'cyan'
    | string;
}

// #endregion
