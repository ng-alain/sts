import { expect } from 'chai';
import * as path from 'path';
import { generator } from '../src/generator';
const url = `https://raw.githubusercontent.com/personball/abplus-zero-template/master/angular/nswag/swagger.json`;
const root = path.join(__dirname, '..');
const file = path.join(root, `test/resources/swagger-io.json`);

describe('generator', () => {
  it('should working', done => {
    generator(file, { path: '/pet', method: 'post' }).then(res => {
      console.log(res);
      done();
    });
  });
});
