import { expect } from 'chai';
import { fake, spy } from 'sinon';
import { BodyParameter, Schema, Spec } from 'swagger-schema-official';
import { generator } from '../src/generator';
import { Config, FullSchema, Options, Result } from '../src/interfaces';
import { deepCopy } from '../src/util';
import { SPEC } from './const';

describe('sf', () => {
  let page: SFPage;

  beforeEach(() => (page = new SFPage()));

  describe('should be return null', () => {
    it('when path is not found', async () => {
      const res = await generator(SPEC, { path: '/invalid-path' });
      expect(res.value).eq(null);
    });
    it('when method is not found', async () => {
      const res = await generator(SPEC, { path: '/pet', method: 'get' });
      expect(res.value).eq(null);
    });
    it('when parameters is not found', async () => {
      const res = await generator(SPEC, { path: '/store/inventory', method: 'get' });
      expect(res.value).eq(null);
    });
    it('when not found body in parameters', async () => {
      const res = await generator(SPEC, { path: '/pet/findByStatus', method: 'get' });
      expect(res.value).eq(null);
    });
    it('when invalid $ref', async () => {
      const a = spy(console, 'error');
      const data = page.getData();
      const parameter = data.paths['/pet'].post!.parameters![0] as BodyParameter;
      parameter!.schema!.$ref = `#/definitions/Pet-invalid`;
      const res = await generator(data, { path: '/pet', method: 'post' });
      expect(res.value).eq(null);
      expect(a.called).eq(true);
    });
  });

  describe('[format]', () => {
    it('should be format is email when key is email and format is null', async () => {
      const data = page.getData({
        properties: {
          email: { type: 'string' },
        },
      });
      await page.getResult(data);
      page.checkValue('email', 'format', 'email');
    });
    it('should be deleted format property when format is empty string', async () => {
      const data = page.getData({
        properties: {
          email: { type: 'string', format: '' },
        },
      });
      await page.getResult(data);
      page.checkDefine('email', 'format', false);
    });
    it('should be deleted format property when type is integer or number', async () => {
      const data = page.getData({
        properties: {
          email: { type: 'string', format: 'int32' },
        },
      });
      await page.getResult(data);
      page.checkDefine('email', 'format', false).checkValue('email', 'type', 'number');
    });
  });

  describe('[title]', () => {
    it('should be map name via propertyMapNames in config', async () => {
      const TITLE = 'EMAIL';
      const data = page.getData({
        properties: {
          email: { type: 'string' },
        },
      });
      await page.getResult(data, null, { propertyMapNames: { email: TITLE } });
      page.checkValue('email', 'title', TITLE);
    });

    describe('#descriptionIsTitle', () => {
      it('with true', async () => {
        const description = 'EMAIL BY DESC';
        const data = page.getData({
          properties: {
            email: { type: 'string', description },
          },
        });
        await page.getResult(data, null, {
          descriptionIsTitle: true,
          propertyMapNames: { email: '' },
        });
        page.checkValue('email', 'title', description).checkDefine('email', 'description', false);
      });
      it('with false', async () => {
        const description = 'EMAIL BY DESC';
        const data = page.getData({
          properties: {
            email: { type: 'string', description },
          },
        });
        await page.getResult(data, null, {
          descriptionIsTitle: false,
          propertyMapNames: { email: '' },
        });
        page.checkValue('email', 'title', undefined).checkDefine('email', 'description', true);
      });
    });
  });

  describe('#custom property', () => {
    it('should be override properites', async () => {
      const data = page.getData({
        properties: {
          email: { type: 'string' },
        },
      });
      await page.getResult(data, null, {
        sf: {
          properties: [{ name: 'email', value: { minimum: 100 } }],
        },
      });
      page.checkValue('email', 'minimum', 100);
    });
    it('should contain path value with the highest priority', async () => {
      const data = page.getData({
        properties: {
          email: { type: 'string' },
        },
      });
      await page.getResult(data, null, {
        sf: {
          properties: [
            { name: 'email', value: { minimum: 100 } },
            { name: 'email', path: '/pet', value: { minimum: 101 } },
          ],
        },
      });
      page.checkValue('email', 'minimum', 101);
    });
  });

  describe('sf not support single property array', () => {
    it('should working', async () => {
      const data = page.getData({
        properties: {
          list: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      });
      await page.getResult(data, null, {
        sf: { singleArray: { type: 'number' } },
      });
      page.checkValue('list', 'type', 'number');
    });
  });

  it('should be override ui via xml date', async () => {
    const data = page.getData({
      properties: {
        email: { type: 'string', xml: { i18n: 'app.name', invalid: 'invalid' } as any },
      },
    });
    await page.getResult(data, null, {
      descriptionIsTitle: false,
      propertyMapNames: { email: '' },
      sf: {
        xmlBlackNames: ['i18n'],
      },
    });
    const ui = page.getValue('email', 'ui');
    expect(typeof ui === 'object').eq(true);
    expect(ui.i18n).eq('app.name');
    page.checkDefine('email', 'invalid', false);
  });

  it('#eachCallback', async () => {
    const options = {
      sf: {
        propertyCallback: fake(),
      },
    };
    await page.getResult(undefined, null, options);
    expect(options.sf.propertyCallback.called).eq(true);
  });

  it('#finishedCallback', async () => {
    const options = {
      sf: {
        finishedCallback: fake(),
      },
    };
    await page.getResult(undefined, null, options);
    expect(options.sf.finishedCallback.called).eq(true);
  });
});

class SFPage {
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

  public async getResult(data?: Spec, options?: Options | null, config: Config | null = null) {
    this.res = await generator(
      data || this.getData(),
      { type: 'sf', path: '/pet', method: 'post', ...options },
      config as Config,
    );
    return this;
  }

  public get properties() {
    return (this.res!.value as FullSchema)!.properties;
  }

  public getValue(name: string, key: string) {
    return (this.properties![name] as any)![key];
  }

  public checkValue(name: string, key: string, value: any) {
    expect((this.properties![name] as any)![key]).eq(value);
    return this;
  }

  public checkDefine(name: string, key: string, result: boolean) {
    const isUndefined = typeof (this.properties![name] as any)![key] === 'undefined';
    expect(isUndefined).eq(!result);
    return this;
  }
}
