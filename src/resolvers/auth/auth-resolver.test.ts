import { Connection, Repository } from 'typeorm';

import { testConnection } from '../../test_utils/test-database';
import { gCall } from '../../test_utils/gCall';
import { User } from '../../entities/user';
import { generateEmail, generateName, generatePassword, generateUsername } from '../../test_utils/data-generator';

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

interface RegisterMutationResponse {
  register: User;
}

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

interface LoginMutationResponse {
  login: User;
}

const meQuery = `
  query Me {
    me {
      email
      username
      firstname
      lastname
    } 
  }
`;

describe('Auth Resolver', () => {
  test('if registering with good values then return user', async () => {
    expect.assertions(2);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeDefined();
    expect((<RegisterMutationResponse>response.data).register.email).toEqual(user.email);
  });

  test('if registering with a non-email then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: '',
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if registering with an already used email then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const email = generateEmail();

    const user2 = {
      email: email,
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName()
    };
    const user1 = userRepository.create({
      email: email,
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName()
    });
    await userRepository.save(user1);

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user2 }
    });

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('duplicate key value violates unique constraint');
  });

  test('if registering with a too short password then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: 'czxcfff',
      username: generateName(),
      firstname: generateName(),
      lastname: generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if registering with a too long password then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: 'bQrd2h2F53p396uttYvYZk3N9YKrZYjn2XwMRAZmTTgDHtqqCS9sfhdeEPe5XbuGJ',
      username: generateName(),
      firstname: generateName(),
      lastname: generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if Login with correct credentials works properly', async () => {
    expect.assertions(1);
    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName()
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

    expect((<LoginMutationResponse>response.data).login.email).toEqual(user.email);
  });

  test('if Me with user works properly', async () => {
    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName(),
      habits: []
    });
    await userRepository.save(user);

    const response = await gCall({
      source: meQuery,
      username: user.username
    });

    expect(response).toMatchObject({
      data: {
        me: {
          email: user.email,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname
        }
      }
    });
  });

  test('if Me with no user returns error', async () => {
    const response = await gCall({
      source: meQuery
    });

    expect(response.errors?.length).toBeGreaterThan(0);
  });
});
