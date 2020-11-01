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

const updatePasswordMutation = `
  mutation UpdatePassword($data: UpdatePasswordInput!) {
    updatePassword(data: $data)
  }
`;
interface UpdatePasswordMutationResponse {
  updatePassword: boolean;
}

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

describe('User Resolver', () => {
  test('if update password with a valid password then it should return true', async () => {
    expect.assertions(2);

    const user = {
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: generateName()
    };

    await gCall({
      source: registerMutation,
      variableValues: { data: user }
    });

    const response = await gCall({
      source: updatePasswordMutation,
      username: user.username,
      variableValues: { data: { password: 'newPassword1' } }
    });

    expect(response.data).not.toBeNull();
    expect((<UpdatePasswordMutationResponse>response.data).updatePassword).toBeTruthy();
  });

  test('if update password with a too short password then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updatePasswordMutation,
      username: 'random_user1',
      variableValues: { data: { password: 'onechar' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Argument Validation Error');
  });

  test('if update password with a too long password then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updatePasswordMutation,
      username: 'random_user1',
      variableValues: { data: { password: 'bQrd2h2F53p396uttYvYZk3N9YKrZYjn2XwMRAZmTTgDHtqqCS9sfhdeEPe5XbuGJ' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Argument Validation Error');
  });

  test('if update password on not logged in user then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updatePasswordMutation,
      variableValues: { data: { password: 'password' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('User is not logged in');
  });

  test('if update password on not existing/different user then it should return error " ..."', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updatePasswordMutation,
      username: 'userdoesntexist',
      variableValues: { data: { password: 'password' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type');
  });
});
