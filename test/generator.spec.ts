import { expect } from 'chai';
import * as path from 'path';
import { SinonSpy, spy } from 'sinon';
import { generator } from '../src/generator';
import * as SF from '../src/sf';
import { SPEC } from './const';

const root = path.join(__dirname, '..');

describe('generator', () => {
  describe('[swagger load]', () => {
    let genSFSpy: SinonSpy<any>;
    beforeEach(() => (genSFSpy = spy(SF, 'generator')));
    afterEach(() => genSFSpy.restore());
    it('with json', async () => {
      await generator({ ...SPEC, ...{ paths: { '/a': {} } } }, { path: '/a' });

      expect(genSFSpy.args[0][0].paths['/a'] != null).eq(true);
    });
    it('with file', async () => {
      await generator(path.join(root, `test/resources/demo.json`), { path: '/a' });

      expect(genSFSpy.called).eq(true);
    });
    it('with null, muse be throw error', async () => {
      try {
        await generator(path.join(root, `test/resources/io.json`), { path: '/a' });
        expect(true).eq(false);
      } catch {
        expect(true).eq(true);
      }
    });
  });
});
