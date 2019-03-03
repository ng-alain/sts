import { expect } from 'chai';
import { fake } from 'sinon';
import { Response, Schema, Spec } from 'swagger-schema-official';
import { generator } from '../src/generator';
import { Config, Options, Result, ResultValue } from '../src/interfaces';
import { deepCopy } from '../src/util';
import { SPEC } from './const';

const PATH = '/pet/findByStatus';

describe('st', () => {
  let page: STPage;

  beforeEach(() => (page = new STPage()));

  describe('should be return null', () => {
    it('when path is not found', async () => {
      await page.getResult(SPEC, { path: '/invalid-path' });
      expect(page.res!.value).eq(null);
    });
    it('when method is not found', async () => {
      await page.getResult(SPEC, { path: PATH, method: 'invalid-method' });
      expect(page.res!.value).eq(null);
    });
    it('when invalid 200', async () => {
      const data = page.getData();
      delete data.paths[PATH].get!.responses!['200'];
      await page.getResult(data, { path: PATH });
      expect(page.res!.value).eq(null);
    });
    it('when invalid type', async () => {
      const data = page.getData();
      const response = data.paths[PATH].get!.responses!['200'] as Response;
      response!.schema = {
        type: 'string',
        items: {
          $ref: '',
        },
      };
      await page.getResult(data, { path: PATH });
      expect(page.res!.value).eq(null);
    });
    it('when invalid $ref', async () => {
      const data = page.getData();
      const response = data.paths[PATH].get!.responses!['200'] as Response;
      response!.schema = {
        type: 'array',
        items: {
          $ref: '',
        },
      };
      await page.getResult(data, { path: PATH });
      expect(page.res!.value).eq(null);
    });
  });

  describe('[title]', () => {
    it('should working', async () => {
      const TITLE = 'EMAIL';
      const data = page.getData({
        properties: {
          email: { type: 'string', title: TITLE },
        },
      });
      await page.getResult(data, null);
      page.checkValue(TITLE, 'title', TITLE);
    });

    it('should be map name via propertyMapNames in config', async () => {
      const TITLE = 'EMAIL';
      const data = page.getData({
        properties: {
          email: { type: 'string' },
        },
      });
      await page.getResult(data, null, { propertyMapNames: { email: TITLE } });
      page.checkValue(TITLE, 'title', TITLE);
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
        page.checkValue(description, 'title', description);
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

        page.checkValue('email', 'title', 'email');
      });
    });
  });

  describe('[index]', () => {
    it('should be ingore [id] property name', async () => {
      await page.getResult();
      page.checkValue('category', 'index', 'category.name');
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
    page.checkValue('email', 'i18n', 'app.name');
    page.checkDefine('email', 'invalid', false);
  });

  it('#eachCallback', async () => {
    const options = {
      st: {
        propertyCallback: fake(),
      },
    };
    await page.getResult(undefined, null, options);
    expect(options.st.propertyCallback.called).eq(true);
  });

  it('#finishedCallback', async () => {
    const options = {
      st: {
        finishedCallback: fake(),
      },
    };
    await page.getResult(undefined, null, options);
    expect(options.st.finishedCallback.called).eq(true);
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

  public async getResult(data?: Spec, options?: Options | null, config: Config | null = null) {
    this.res = await generator(
      data || this.getData(),
      { type: 'st', path: PATH, ...options },
      config as Config,
    );
    return this;
  }

  public get columns() {
    return this.res!.value as ResultValue[];
  }

  public getValue(name: string) {
    return this.columns.find(w => w.title === name);
  }

  public checkValue(name: string, key: string, value: any) {
    const item = this.getValue(name);
    expect(item != null).eq(true);
    expect(item![key]).eq(value);
    return this;
  }

  public checkDefine(name: string, key: string, result: boolean) {
    const item = this.getValue(name);
    expect(item != null).eq(true);
    expect(typeof item![key] === 'undefined').eq(!result);
    return this;
  }
}
