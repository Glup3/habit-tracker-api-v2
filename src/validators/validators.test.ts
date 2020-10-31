import { Validator } from 'class-validator';
import { IsUsername } from './isUsername';

const validator = new Validator();

describe('Username Validator', () => {
  class MyClass {
    @IsUsername()
    username: string;
  }

  test('if username is alphanumeric with underscores then it should succeed', async () => {
    expect.assertions(1);
    const model = new MyClass();
    model.username = 'user1';
    const errors = await validator.validate(model);
    expect(errors.length).toEqual(0);
  });

  test('if username consists of only letters then it should succeed', async () => {
    expect.assertions(1);
    const model = new MyClass();
    model.username = 'mikethebest';
    const errors = await validator.validate(model);
    expect(errors.length).toEqual(0);
  });

  test('if username consists of only numbers then it should fail', async () => {
    expect.assertions(1);
    const model = new MyClass();
    model.username = '77777';
    const errors = await validator.validate(model);
    expect(errors.length).toEqual(1);
  });

  test('if username consists of only underscores then it should fail', async () => {
    expect.assertions(1);
    const model = new MyClass();
    model.username = '______';
    const errors = await validator.validate(model);
    expect(errors.length).toEqual(1);
  });

  test('if username is alphanumeric with underscores but it has spaces then it should fail', async () => {
    expect.assertions(1);
    const model = new MyClass();
    model.username = 'jfiowae312 fasod3';
    const errors = await validator.validate(model);
    expect(errors.length).toEqual(1);
  });

  test('if username consists of only spaces then it should fail', async () => {
    expect.assertions(1);
    const model = new MyClass();
    model.username = '         ';
    const errors = await validator.validate(model);
    expect(errors.length).toEqual(1);
  });

  test('if username is empty then it should fail', async () => {
    expect.assertions(1);
    const model = new MyClass();
    model.username = '';
    const errors = await validator.validate(model);
    expect(errors.length).toEqual(1);
  });

  test('if username starts with a number then it should fail', async () => {
    expect.assertions(1);
    const model = new MyClass();
    model.username = '1nicename';
    const errors = await validator.validate(model);
    expect(errors.length).toEqual(1);
  });

  test('if username starts with a underscore then it should fail', async () => {
    expect.assertions(1);
    const model = new MyClass();
    model.username = '_ni123cename';
    const errors = await validator.validate(model);
    expect(errors.length).toEqual(1);
  });

  test('if username contains non-alphanumeric characters then it should fail', async () => {
    expect.assertions(1);
    const model = new MyClass();
    model.username = 'name123]';
    const errors = await validator.validate(model);
    expect(errors.length).toEqual(1);
  });
});
