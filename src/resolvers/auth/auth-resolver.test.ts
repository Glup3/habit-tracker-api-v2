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

interface MeQueryResponse {
  me: User;
}

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

  test('if registering with a username that has underscores then return user', async () => {
    expect.assertions(2);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: 'cool_name_12',
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

  test('if registering with a too long username then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateName(33),
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

  test('if registering with a too short username then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateName(2),
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

  test('if registering with a invalid username (space) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: 'oij awe',
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

  test('if registering with a invalid username (special chars) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: 'fesss123*(&',
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

  test('if registering with a invalid username (doesnt start with a char) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: '6fsdesss123*(&',
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

  test('if registering with a too short firstname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: '',
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

  test('if registering with a too long firstname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(33),
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

  test('if registering with a invalid firstname (numbers) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: 'maximilian444',
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

  test('if registering with a invalid firstname (special chars) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: 'maximilian}}[',
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

  test('if registering with a too short lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: ''
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

  test('if registering with a too long lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: generateName(33)
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

  test('if registering with a invalid lastname (numbers) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: 'maximilian444'
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

  test('if registering with a invalid lastname (special chars) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: 'maximilian}}['
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

  test('if login with correct email and password then it should return user', async () => {
    expect.assertions(2);
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

    expect(response.data).toBeDefined();
    expect((<LoginMutationResponse>response.data).login.email).toEqual(user.email);
  });

  test('if login with incorrect email then it should return error "Email or Password is invalid"', async () => {
    expect.assertions(4);
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
          email: 'email@doesnt.exist',
          password: user.password
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Email or Password is invalid');
  });

  test('if login with invalid email then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: loginMutation,
      variableValues: {
        data: {
          email: 'emailisinvalid',
          password: 'randompw22'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if login with incorrect password then it should return error "Email or Password is invalid"', async () => {
    expect.assertions(4);
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
          email: 'email@doesnt.exist',
          password: 'randompw123'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Email or Password is invalid');
  });

  test('if login with too short password then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: loginMutation,
      variableValues: {
        data: {
          email: 'random@email.com',
          password: 'onechar'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if login with too long password then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: loginMutation,
      variableValues: {
        data: {
          email: 'random@email.com',
          password: 'bQrd2h2F53p396uttYvYZk3N9YKrZYjn2XwMRAZmTTgDHtqqCS9sfhdeEPe5XbuGJ'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if logged in user gets Me data then return user', async () => {
    expect.assertions(2);
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

    expect(response.data).toBeDefined();
    expect((<MeQueryResponse>response.data).me.username).toEqual(user.username);
  });

  test('if logged out user gets Me data then return error "User is not logged in"', async () => {
    const response = await gCall({
      source: meQuery
    });

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('User is not logged in');
  });
});
