import { Connection, Repository } from 'typeorm';

import { testConnection } from '../../test_utils/test-database';
import { gCall } from '../../test_utils/gCall';
import { User } from '../../entities/user';
import { DataGenerator } from '../../test_utils/data-generator';
import { Maybe } from 'graphql/jsutils/Maybe';
import { ArgumentValidationError } from 'type-graphql';

let conn: Connection;
let dataGenerator: DataGenerator;
let userRepository: Repository<User>;

beforeAll(async () => {
  conn = await testConnection();
  userRepository = conn.getRepository(User);
  dataGenerator = new DataGenerator(11111);
});

afterAll(async () => {
  await conn.close();
});

const registerMutation = `
  mutation Register($data: RegisterInput!) {
    register(data: $data) {
      user {
        email
        username
        firstname
        lastname
      }
    }
  }
`;

const loginMutation = `
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      user {
        username
        email
        firstname
        lastname
      }
    }
  }
`;

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
    expect.assertions(1);

    const user = {
      email: 'funny@email.com',
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(8),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response).toMatchObject({
      data: {
        register: {
          user: {
            email: user.email,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname
          }
        }
      }
    });
  });

  test('if registering with a non-email then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: '',
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isEmail
    ).toEqual('email must be an email');
  });

  test('if registering with an already used email then it should return Error "duplicate key value violates unique constraint"', async () => {
    expect.assertions(4);

    const email = dataGenerator.generateEmail();

    const user2 = {
      email: email,
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };
    const user1 = userRepository.create({
      email: email,
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    });
    await userRepository.save(user1);

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user2 }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('duplicate key value violates unique constraint');
  });

  test('if registering with a too short password then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: 'czxcfff',
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.length
    ).toEqual('password must be longer than or equal to 8 characters');
  });

  test('if registering with a too long password then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: 'bQrd2h2F53p396uttYvYZk3N9YKrZYjn2XwMRAZmTTgDHtqqCS9sfhdeEPe5XbuGJ',
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.length
    ).toEqual('password must be shorter than or equal to 64 characters');
  });

  test('if registering with an username that has underscores then return user', async () => {
    expect.assertions(1);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: 'cool_name_12',
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response).toMatchObject({
      data: {
        register: {
          user: {
            email: user.email,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname
          }
        }
      }
    });
  });

  test('if registering with a too long username then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(33),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.length
    ).toEqual('username must be shorter than or equal to 32 characters');
  });

  test('if registering with a too short username then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(2),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.length
    ).toEqual('username must be longer than or equal to 3 characters');
  });

  test('if registering with an invalid username (space) then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: 'oij awe',
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isUsername
    ).toEqual('');
  });

  test('if registering with an invalid username (special chars) then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: 'fesss123*(&',
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isUsername
    ).toEqual('');
  });

  test('if registering with an invalid username (doesnt start with a char) then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: '6fsdesss123*(&',
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isUsername
    ).toEqual('');
  });

  test('if registering with a too short firstname then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: '',
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.length
    ).toEqual('firstname must be longer than or equal to 1 characters');
  });

  test('if registering with a too long firstname then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(33),
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.length
    ).toEqual('firstname must be shorter than or equal to 32 characters');
  });

  test('if registering with an invalid firstname (numbers) then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: 'maximilian444',
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isAlpha
    ).toEqual('firstname must contain only letters (a-zA-Z)');
  });

  test('if registering with an invalid firstname (special chars) then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: 'maximilian}}[',
      lastname: dataGenerator.generateName()
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isAlpha
    ).toEqual('firstname must contain only letters (a-zA-Z)');
  });

  test('if registering with a too short lastname then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: ''
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.length
    ).toEqual('lastname must be longer than or equal to 1 characters');
  });

  test('if registering with a too long lastname then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(33)
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.length
    ).toEqual('lastname must be shorter than or equal to 32 characters');
  });

  test('if registering with an invalid lastname (numbers) then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: 'maximilian444'
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isAlpha
    ).toEqual('lastname must contain only letters (a-zA-Z)');
  });

  test('if registering with an invalid lastname (special chars) then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: 'maximilian}}['
    };

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isAlpha
    ).toEqual('lastname must contain only letters (a-zA-Z)');
  });

  test('if login with correct email and password then it should return user', async () => {
    expect.assertions(1);
    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
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
          user: {
            email: user.email,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname
          }
        }
      }
    });
  });

  test('if login with incorrect email then it should return error "Email or Password is invalid"', async () => {
    expect.assertions(4);
    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
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
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Email or Password is invalid');
  });

  test('if login with invalid email then it should return Argument Validation Error', async () => {
    expect.assertions(5);

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
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isEmail
    ).toEqual('email must be an email');
  });

  test('if login with incorrect password then it should return error "Email or Password is invalid"', async () => {
    expect.assertions(4);
    const user = {
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName()
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
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Email or Password is invalid');
  });

  test('if login with too short password then it should return Argument Validation Error', async () => {
    expect.assertions(5);

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
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.length
    ).toEqual('password must be longer than or equal to 8 characters');
  });

  test('if login with too long password then it should return Argument Validation Error', async () => {
    expect.assertions(5);

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
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.length
    ).toEqual('password must be shorter than or equal to 64 characters');
  });

  test('if logged in user gets Me data then return user', async () => {
    expect.assertions(2);
    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: []
    });
    await userRepository.save(user);

    const response = await gCall({
      source: meQuery,
      username: user.username
    });

    expect(response.data).not.toBeNull();
    expect((<MeQueryResponse>response.data).me.username).toEqual(user.username);
  });

  test('if logged out user gets Me data then return error "User is not logged in"', async () => {
    const response = await gCall({
      source: meQuery
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('User is not logged in');
  });
});
