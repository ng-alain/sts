## ng-alain-sts [![Build Status](https://img.shields.io/travis/ng-alain/sts/master.svg?style=flat-square)](https://travis-ci.org/ng-alain/ng-alain-sts) [![NPM version](https://img.shields.io/npm/v/ng-alain-sts.svg?style=flat-square)](https://www.npmjs.com/package/ng-alain-sts)

Convert Swagger API to [sf](https://ng-alain.com/form/schema) Schema & [st](https://ng-alain.com/components/table#STColumn) columns in [ng-alain](https://ng-alain.com) projects.

## 如何使用

`ng-alain-sts` 是一个 Node 插件，你可以使用命令行或直接调用 `generator` 方法来获取转换后的 `sf` Schema 和 `st` 列描述。

```bash
# via npm
npm i ng-alain-sts --save-dev
# via yarn
yarn add -D ng-alain-sts
```

### ng-alain

`ng-alain-sts` 是专注于 NG-ALAIN，因此在 NG-ALAIN CLI 提供一个快捷命令：

```bash
ng g ng-alain:sts
```

它包含 `list`、`edit` 两个[自定义模板](https://ng-alain.com/cli/generate#Custom-template-page)，可以通过指令根据 Swagger API 接口来生成列表、编辑页。

```bash
ng g ng-alain:module trade
ng g ng-alain:tpl swagger-list list -m=trade -t=trade --swaggerPath=/pet/findByStatus
```

> 更多请参考[sts](https://ng-alain.com/cli/plugin#sts)插件。

### 命令行

```bash
ng-alain-sts -t=sf -p=/pet swagger.json
```

**参数**

| 参数名          | 类型     | 默认                  | 描述                       |
|-----------------|----------|-----------------------|--------------------------|
| `-t` `--type`   | `sf,st`  | `sf`                  | 指定生成类型               |
| `-p` `--path`   | `string` | `-`                   | **必填** 指定 `paths` 路径 |
| `-m` `--method` | `string` | `get`                 | 指定请求方法               |
| `-c` `--config` | `string` | `swagger-config.json` | 指定配置文件路径           |

### 调用

```ts
const sts = require('ng-alain-sts/src/generator');

await sts.generator(
  'https://petstore.swagger.io/v2/swagger.json',
  { type: 'sf' },
  { descriptionIsTitle: true }
);
```

## 配置文件

Swagger API 接口对于每一个后端语言或企业风格有着统一的编码风格、约定，如何更好的利用这些约定使生成的结构更符合当前的开发风格，从而进一步提升开发体验；配置文件给予了一些更自由空间，我们建议针对自己的接口风格定制不同的配置信息。

### Config

| 参数             | 说明                     | 类型  | 默认值 |
|------------------|-------------------------|-------|--------|
| `requestOptions` | Swagger JSON 文件[网络请求配置项](https://github.com/request/request#requestoptions-callback) | `any` | -      |
| `pathPrefix` | 路径前缀 | `string` | - |
| `propertyMapNames` | 自定义属性名称映射 | `{ [name: string]: string }` | `{ id: '编号', name: '名称' }` |
| `descriptionIsTitle` | 指定 `description` 为 `title`，并删除 `description` | `boolean` | `true` |
| `sf` | `sf` 配置项 | `SFConfig` | - |
| `st` | `st` 配置项 | `STConfig` | - |

### SFConfig

| 参数             | 说明                     | 类型  | 默认值 |
|------------------|-------------------------|-------|--------|
| `method` | 指定默认方法名 | `string` | `put` |
| `singleArray` | 由于 `sf` 并不支持这种类型，默认被转化为 `select` 小部件 | `SFSchema` | - |
| `properties` | 自定义属性的 `Schema` | `PathConfig[]` | - |
| `xmlBlackNames` | XML 属性白名单，这些信息会以优先级最高直接传递给 `ui` | `string[]` | - |
| `propertyCallback` | 递归属性回调 | `(optinos: SFPropertyCallbackOptions) => void` | - |
| `finishedCallback` | 完成时回调 | `(optinos: SFFinishedCallbackOptions) => void` | - |

**singleArray**

单类型数组默认被转化为 `select` 小部件：

```ts
{
  type: 'string',
  ui: {
    widget: 'select',
    mode: 'tags',
  },
  default: null,
}
```

### STConfig

| 参数             | 说明                     | 类型  | 默认值 |
|------------------|-------------------------|-------|--------|
| `method` | 指定默认方法名 | `string` | `get` |
| `properties` | 自定义属性的 `Schema` | `PathConfig[]` | - |
| `nameToType` | 根据名称自定义类型 | `{ [name: string]: STColumnType }` | - |
| `xmlBlackNames` | XML 属性白名单，这些信息会以优先级最高直接传递给 `STColumn` | `string[]` | `['i18n']` |
| `propertyCallback` | 递归属性回调 | `(optinos: STPropertyCallbackOptions) => void` | - |
| `finishedCallback` | 完成时回调 | `(optinos: STFinishedCallbackOptions) => void` | - |

**nameToType**

定制根据名称自定义类型，默认值为：

```ts
{
  price: 'currency',
  amount: 'currency',
  num: 'number',
  count: 'number',
  avatar: 'img',
  mp: 'img',
  modified: 'date',
  created: 'date',
}
```

### PathConfig

| 参数    | 说明    | 类型  | 默认值 |
|--------|---------|-------|--------|
| `name` | 属性名称 | `string` | - |
| `path` | 指定路径，若不指定则该属性名对所有 path 有效 | `string` | - |
| `value` | 值分为 `SFSchema` 或 `STColumn` 类型 | `SFSchema | STColumn` | - |

## License

MIT
