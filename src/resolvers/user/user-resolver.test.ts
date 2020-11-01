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

const updateEmailMutation = `
  mutation UpdateEmail($data: UpdateEmailInput!) {
    updateEmail(data: $data)
  }
`;
interface UpdateEmailMutationResponse {
  updateEmail: boolean;
}

const updateUsernameMutation = `
  mutation UpdateUsername($data: UpdateUsernameInput!) {
    updateUsername(data: $data)
  }
`;
interface UpdateUsernameMutationResponse {
  updateUsername: boolean;
}

const updateMeMutation = `
  mutation UpdateMe($data: UpdateMeInput!) {
    updateMe(data: $data) {
      username
      firstname
      lastname
    }
  }
`;
interface UpdateMeMutationResponse {
  updateMe: User;
}

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

  test('if update password on not existing/different user then it should return error "Could not find any entity of type"', async () => {
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

  test('if update email with a valid and new email then it should return true', async () => {
    expect.assertions(2);

    const user = userRepository.create({
      email: 'insane@custom.email',
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: generateName()
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateEmailMutation,
      username: user.username,
      variableValues: { data: { email: 'mynew@email.com' } }
    });

    expect(response.data).not.toBeNull();
    expect((<UpdateEmailMutationResponse>response.data).updateEmail).toBeTruthy();
  });

  test('if update email with an invalid email then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateEmailMutation,
      username: 'random_user1',
      variableValues: { data: { email: 'notanemail.com' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Argument Validation Error');
  });

  test('if update email with no email then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateEmailMutation,
      username: 'random_user1',
      variableValues: { data: { email: '' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Argument Validation Error');
  });

  test('if update email with an already existing email then it should return false', async () => {
    expect.assertions(2);

    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: generateName()
    });

    await userRepository.save(user);

    const response = await gCall({
      source: updateEmailMutation,
      username: 'random_user',
      variableValues: { data: { email: user.email } }
    });

    expect(response.data).not.toBeNull();
    expect((<UpdateEmailMutationResponse>response.data).updateEmail).toBeFalsy();
  });

  test('if update email on not logged in user then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateEmailMutation,
      variableValues: { data: { email: 'creative@new.email' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('User is not logged in');
  });

  test('if update email on not existing/different user then it should return error "Could not find any entity of type"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateEmailMutation,
      username: 'userdoesntexist',
      variableValues: { data: { email: 'my@new.email' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type');
  });

  test('if update username with a valid username then it should return true', async () => {
    expect.assertions(2);

    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: 'thecoolest_username132',
      firstname: generateName(),
      lastname: generateName()
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateUsernameMutation,
      username: user.username,
      variableValues: { data: { username: 'cool_new_username1' } }
    });

    expect(response.data).not.toBeNull();
    expect((<UpdateUsernameMutationResponse>response.data).updateUsername).toBeTruthy();
  });

  test('if update username with a too short username then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateUsernameMutation,
      username: 'random_user1',
      variableValues: { data: { username: 'ff' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Argument Validation Error');
  });

  test('if update username with a too long username then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateUsernameMutation,
      username: 'random_user1',
      variableValues: { data: { username: 'NBBWnW96sf22nVqHvZvXapJQrzsFUFdwb' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Argument Validation Error');
  });

  test('if update username with an empty username then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateUsernameMutation,
      username: 'random_user1',
      variableValues: { data: { username: '' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Argument Validation Error');
  });

  test('if update username with an invalid username (special chars) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateUsernameMutation,
      username: 'random_user1',
      variableValues: { data: { username: 'username][31-' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Argument Validation Error');
  });

  test('if update username with an invalid username (doesnt start with a char) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateUsernameMutation,
      username: 'random_user1',
      variableValues: { data: { username: '323_userfname' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Argument Validation Error');
  });

  test('if update username on not logged in user then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateUsernameMutation,
      variableValues: { data: { username: 'newUsername321' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('User is not logged in');
  });

  test('if update username on not existing/different user then it should return error "Could not find any entity of type"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateUsernameMutation,
      username: 'userdoesntexist',
      variableValues: { data: { username: 'bestUsername312' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type');
  });

  test('if update user with valid firstname and valid lastname then it should return user', async () => {
    expect.assertions(3);

    const firstname = 'Max';
    const lastname = 'Mustermann';

    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: generateName()
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateMeMutation,
      username: user.username,
      variableValues: { data: { firstname, lastname } }
    });

    expect(response.data).not.toBeNull();
    expect((<UpdateMeMutationResponse>response.data).updateMe.firstname).toEqual(firstname);
    expect((<UpdateMeMutationResponse>response.data).updateMe.lastname).toEqual(lastname);
  });

  test('if update user with only valid firstname then it should return user', async () => {
    expect.assertions(2);

    const firstname = 'Max';

    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: generateName()
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateMeMutation,
      username: user.username,
      variableValues: { data: { firstname } }
    });

    expect(response.data).not.toBeNull();
    expect((<UpdateMeMutationResponse>response.data).updateMe.firstname).toEqual(firstname);
  });

  test('if update user with only valid lastname then it should return user', async () => {
    expect.assertions(2);

    const lastname = 'Mustermann';

    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: generateName()
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateMeMutation,
      username: user.username,
      variableValues: { data: { lastname } }
    });

    expect(response.data).not.toBeNull();
    expect((<UpdateMeMutationResponse>response.data).updateMe.lastname).toEqual(lastname);
  });

  test('if update user with no firstname and no lastname then it should return unchanged user', async () => {
    expect.assertions(3);

    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: generateName()
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateMeMutation,
      username: user.username,
      variableValues: { data: {} }
    });

    expect(response.data).not.toBeNull();
    expect((<UpdateMeMutationResponse>response.data).updateMe.firstname).toEqual(user.firstname);
    expect((<UpdateMeMutationResponse>response.data).updateMe.lastname).toEqual(user.lastname);
  });

  test('if update user with too short firstname and valid lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { firstname: '', lastname: 'Mustermann' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with too long firstname and valid lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { firstname: generateName(33), lastname: 'Mustermann' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with valid firstname and too short lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { firstname: generateName(), lastname: '' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with valid firstname and too long lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { firstname: generateName(), lastname: generateName(33) } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with too short firstname and too short lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { firstname: '', lastname: '' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with too long firstname and too long lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { firstname: generateName(33), lastname: generateName(33) } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with too short firstname and no lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { firstname: '' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with too long firstname and no lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { firstname: generateName(33) } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with no firstname and too short lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { lastname: '' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with no firstname and too long lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { lastname: generateName(33) } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with invalid firstname (numbers) and no lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { firstname: 'namewith123' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with invalid firstname (special chars) and no lastname then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { firstname: 'namewith[[**/' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with no firstname and invalid lastname (numbers) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { lastname: 'namewith123' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user with no firstname and invalid lastname (special chars) then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'random_user',
      variableValues: { data: { lastname: 'namewith[[**/' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if update user on not logged in user with valid firstname and valid lastname then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      variableValues: { data: { firstname: 'Max', lastname: 'Mustermann' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('User is not logged in');
  });

  test('if update user on not existing/different user with valid firstname and valid lastname then it should return error "Could not find any entity of type"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateMeMutation,
      username: 'userdoesntexist',
      variableValues: { data: { firstname: 'Max', lastname: 'Mustermann' } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type');
  });
});
