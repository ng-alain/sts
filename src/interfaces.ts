import { STColumn } from '@delon/abc';
import { SFSchema } from '@delon/form';
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
  sfMethod: 'put',
  stMethod: 'get',
};

export interface Config {
  /** 请求 swagger JSON 文件[配置项](https://github.com/request/request#requestoptions-callback) */
  requestOptions?: any;
  /** 路径前缀 */
  pathPrefix?: string;
  /** 指定 `sf` 默认 `method` 类型，默认值：`put` */
  sfMethod?: string;
  /** 指定 `st` 默认 `method` 类型，默认值：`get` */
  stMethod?: string;
  /** 自定义 `paths` */
  paths?: { [path: string]: PathConfig[] };
}

export interface PathConfig {
  /**
   * 自定义属性名称
   */
  key: string;
  /**
   * 自定义 `sf` 属性值
   */
  sf?: SFSchema;
  /**
   * 自定义 `st` 属性值
   */
  st?: STColumn;
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
  definitions?: { [definitionsName: string]: Schema };
}

export interface STResult {
  [key: string]: any;
}
