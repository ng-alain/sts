import { expect } from 'chai';
import { spy } from 'sinon';
import { BodyParameter, Schema, Spec } from 'swagger-schema-official';
import { generator } from '../src/generator';
import { Config, Options, Result } from '../src/interfaces';
import { deepCopy } from '../src/util';
import { SPEC } from './const';

describe('st', () => {
  let page: STPage;

  beforeEach(() => (page = new STPage()));

  it('should be working', async () => {
    const res = await page.getResult(page.getData(), { path: '/pet/findByStatus' });
    console.log(res);
    debugger;
  });

  xdescribe('should be return null', () => {
    xit('when path is not found', async () => {
      const res = await generator(SPEC, { path: '/invalid-path' });
      expect(res.value).eq(null);
    });
    xit('when method is not found', async () => {
      const res = await generator(SPEC, { path: '/pet', method: 'get' });
      expect(res.value).eq(null);
    });
    it('when parameters is not found', async () => {
      const res = await generator(SPEC, { path: '/store/inventory', method: 'get' });
      expect(res.value).eq(null);
    });
    xit('when not found body in parameters', async () => {
      const res = await generator(SPEC, { path: '/pet/findByStatus', method: 'get' });
      expect(res.value).eq(null);
    });
    xit('when invalid $ref', async () => {
      const a = spy(console, 'error');
      const data = page.getData();
      const parameter = data.paths['/pet'].post!.parameters![0] as BodyParameter;
      parameter!.schema!.$ref = `#/definitions/Pet-invalid`;
      const res = await generator(data, { path: '/pet', method: 'post' });
      expect(res.value).eq(null);
      expect(a.called).eq(true);
    });
  });
});

class STPage {
  public res: Result | null = null;

  public getData(override?: Schema, propertyName?: string): Spec {
    const data = deepCopy(SPEC) as Spec;
    if (override) {
      if (propertyName) {
        Object.assign(data!.definitions!.Pet!.properties![propertyName], override);
      } else {
        Object.assign(data!.definitions!.Pet, override);
      }
    }
    return data;
  }

  public async getResult(data: Spec, options: Options | null = null, config: Config | null = null) {
    this.res = await generator(
      data,
      { type: 'st', path: '/pet/findByStatus', ...options },
      config as Config,
    );
    return this;
  }

  public checkValue(name: string, key: string, value: any) {
    expect(this.res!.value!.properties![name]![key]).eq(value);
    return this;
  }

  public checkDefine(name: string, key: string, result: boolean) {
    const isUndefined = typeof this.res!.value!.properties![name]![key] === 'undefined';
    expect(isUndefined).eq(!result);
    return this;
  }
}
