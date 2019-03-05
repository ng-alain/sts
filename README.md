## ng-alain-sts [![Build Status](https://img.shields.io/travis/ng-alain/ng-alain-sts/master.svg?style=flat-square)](https://travis-ci.org/ng-alain/ng-alain-sts) [![NPM version](https://img.shields.io/npm/v/ng-alain-sts.svg?style=flat-square)](https://www.npmjs.com/package/ng-alain-sts)

Convert Swagger API to [sf](https://ng-alain.com/form/schema) Schema & [st](https://ng-alain.com/components/table#STColumn) columns in [ng-alain](https://ng-alain.com) projects.

## 如何使用

`ng-alain-sts` 是一个 NodeJs 插件，你可以运行在使

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

## License

MIT
