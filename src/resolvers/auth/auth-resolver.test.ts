import { Connection, Repository } from 'typeorm';
import faker from 'faker';

import { testConnection } from '../../test_utils/test-database';
import { gCall } from '../../test_utils/gCall';
import { User } from '../../entities/user';

let conn: Connection;
let userRepository: Repository<User>;

beforeAll(async () => {
  conn = await testConnection();
  userRepository = conn.getRepository(User);
});

afterAll(async () => {
  await conn.close();
});

const registerMutation = `
  mutation Register($data: RegisterInput!) {
    register(data: $data) {
      email
      username
      firstname
      lastname
    }
  }
`;

const loginMutation = `
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      username
      email
      firstname
      lastname
    }
  }
`;

describe('Auth Resolver', () => {
  test('if Register with normal args works properly', async () => {
    const user = {
      email: faker.internet.email(),
      password: faker.internet.password(),
      username: faker.name.findName(),
      firstname: faker.name.firstName(),
      lastname: faker.name.lastName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response).toMatchObject({
      data: {
        register: {
          email: user.email,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname
        }
      }
    });

    const dbUser = await userRepository.findOne({ email: user.email });
    expect(dbUser).toBeDefined();
    expect(dbUser?.email).toEqual(user.email);
  });

  test('if Login with correct credentials works properly', async () => {
    const user = {
      email: faker.internet.email(),
      password: faker.internet.password(),
      username: faker.name.findName(),
      firstname: faker.name.firstName(),
      lastname: faker.name.lastName()
    };

    await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    const response = await gCall({
      source: loginMutation,
      variableValues: {
        data: {
          email: user.email,
          password: user.password
        }
      }
    });

    expect(response).toMatchObject({
      data: {
        login: {
          email: user.email,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname
        }
      }
    });
  });
});
