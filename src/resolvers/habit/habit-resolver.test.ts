import { Connection, Repository } from 'typeorm';

import { testConnection } from '../../test_utils/test-database';
import { gCall } from '../../test_utils/gCall';
import {
  generateDate,
  generateDescription,
  generateEmail,
  generateName,
  generatePassword,
  generateTitle,
  generateUsername
} from '../../test_utils/data-generator';
import { User } from '../../entities/user';
import { Habit } from '../../entities/habit';
import { AddHabitPayload, RemoveHabitPayload } from './habit-types';

let conn: Connection;
let userRepository: Repository<User>;
let habitRepository: Repository<Habit>;

beforeAll(async () => {
  conn = await testConnection();
  userRepository = conn.getRepository(User);
  habitRepository = conn.getRepository(Habit);
});

afterAll(async () => {
  await conn.close();
});

const addHabitMutation = `
  mutation AddHabit($data: AddHabitInput!) {
    addHabit (data:$data) {
      habit {
        title
        description
        startDate
      }
    }
  }
`;
interface AddHabitMutationResponse {
  addHabit: AddHabitPayload;
}

const habitQuery = `
  query Habit($data: HabitInput!) {
    habit(data: $data) {
      id
      title
      description
      startDate
      entries {
        id
      }
    }
  }
`;

const myHabitsQuery = `
  query MyHabits {
    myHabits {
      id
      title
      description
      startDate
    }
  }
`;

interface MyHabitsQueryResult {
  myHabits: Habit[];
}

const removeHabitMutation = `
  mutation RemoveHabit($data: RemoveHabitInput!) {
    removeHabit(data: $data) {
      habit {
        id
        title
        description
        startDate
      }
    }
  }
`;

interface RemoveHabitMutationResult {
  removeHabit: RemoveHabitPayload;
}

describe('Habit Resolver', () => {
  test('if user adds habit with valid title, valid description and valid startDate then it should return created habit', async () => {
    expect.assertions(2);

    const habit = {
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    };
    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: 'superunqiue_1',
      firstname: generateName(),
      lastname: generateName(),
      habits: []
    });
    await userRepository.save(user);

    const response = await gCall({
      source: addHabitMutation,
      variableValues: { data: habit },
      username: user.username
    });

    expect(response.data).not.toBeNull();
    expect((<AddHabitMutationResponse>response.data).addHabit.habit.title).toEqual(habit.title);
  });

  test('if user adds habit with valid title, no description and valid startDate then it should return created habit', async () => {
    expect.assertions(2);

    const habit = {
      title: generateTitle(),
      startDate: generateDate().toISOString()
    };
    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: 'another_user1',
      firstname: generateName(),
      lastname: generateName(),
      habits: []
    });
    await userRepository.save(user);

    const response = await gCall({
      source: addHabitMutation,
      variableValues: { data: habit },
      username: user.username
    });

    expect(response.data).not.toBeNull();
    expect((<AddHabitMutationResponse>response.data).addHabit.habit.description).toBeNull();
  });

  test('if user adds habit with too long title, valid description and valid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const habit = {
      title: generateTitle(65),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    };

    const response = await gCall({
      source: addHabitMutation,
      variableValues: { data: habit },
      username: 'super_user'
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if user adds habit with valid title, too long description and valid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const habit = {
      title: generateTitle(),
      description: generateDescription(256),
      startDate: generateDate().toISOString()
    };

    const response = await gCall({
      source: addHabitMutation,
      variableValues: { data: habit },
      username: 'super_user'
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if user adds habit with valid title, valid description and invalid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const habit = {
      title: generateTitle(),
      description: generateDescription(256),
      startDate: 'not a date'
    };

    const response = await gCall({
      source: addHabitMutation,
      variableValues: { data: habit },
      username: 'super_user'
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
  });

  test('if user who is not logged in adds a valid habit then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const habit = {
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    };

    const response = await gCall({
      source: addHabitMutation,
      variableValues: { data: habit }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('User is not logged in');
  });

  test('if user who doesnt exist adds habit then it should throw error "EntityNotFound: Could not find any entity of type User"', async () => {
    expect.assertions(4);

    const habit = {
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    };

    const response = await gCall({
      source: addHabitMutation,
      username: 'idontexist',
      variableValues: { data: habit }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type "User"');
  });

  test('if user adds multiple valid habits then user should have those habits', async () => {
    const habit1 = {
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    };
    const habit2 = {
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    };
    const habit3 = {
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    };
    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName(),
      habits: []
    });
    userRepository.save(user);

    await gCall({
      source: addHabitMutation,
      variableValues: { data: habit1 },
      username: user.username
    });
    await gCall({
      source: addHabitMutation,
      variableValues: { data: habit2 },
      username: user.username
    });
    await gCall({
      source: addHabitMutation,
      variableValues: { data: habit3 },
      username: user.username
    });

    const dbUser = await userRepository.findOne({ where: { username: user.username }, relations: ['habits'] });
    const habits = await habitRepository.find({ where: { user: dbUser } });

    expect(dbUser).toBeDefined();
    expect(habits).not.toBeNull();
    expect(dbUser?.habits.length).toEqual(habits.length);
  });

  test('if user requests a habit he owns by id then it should return habit', async () => {
    expect.assertions(2);

    const habit1 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    const habit2 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });

    const h1 = await habitRepository.save(habit1);
    await habitRepository.save(habit2);

    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName(),
      habits: [habit1, habit2]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: habitQuery,
      username: user.username,
      variableValues: { data: { id: h1.id } }
    });

    expect(response.data).not.toBeNull();
    expect(response).toMatchObject({
      data: {
        habit: {
          title: habit1.title,
          description: habit1.description,
          startDate: habit1.startDate
        }
      }
    });
  });

  test('if user requests a habit he does not own by id then it should throw error "Habit with the ID does not exist"', async () => {
    expect.assertions(4);

    const habit = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);
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
      source: habitQuery,
      username: user.username,
      variableValues: { data: { id: savedHabit.id } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual(`Habit with the ID ${savedHabit.id} does not exist`);
  });

  test('if user who is not logged in requests a habit then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: habitQuery,
      variableValues: { data: { id: 1 } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('User is not logged in');
  });

  test('if user who doesnt exist removes a habit then it should throw error "EntityNotFound: Could not find any entity of type User"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: habitQuery,
      username: 'idontexist',
      variableValues: { data: { id: 1 } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type "User"');
  });

  test('if user requests all his habits then it should return all his habits', async () => {
    expect.assertions(2);

    const habit1 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    const habit2 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    const habit3 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    const habit4 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    const habit5 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });

    await habitRepository.save(habit1);
    await habitRepository.save(habit2);
    await habitRepository.save(habit3);
    await habitRepository.save(habit4);
    await habitRepository.save(habit5);

    const user1 = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName(),
      habits: [habit1, habit2, habit4, habit5]
    });
    const user2 = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName(),
      habits: [habit3]
    });
    await userRepository.save(user1);
    await userRepository.save(user2);

    const response = await gCall({
      source: myHabitsQuery,
      username: user1.username
    });

    expect(response.data).not.toBeNull();
    expect((<MyHabitsQueryResult>response.data).myHabits.length).toEqual(user1.habits.length);
  });

  test('if user doesnt have habits and requests all his habits then it should return empty array', async () => {
    expect.assertions(3);

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
      source: myHabitsQuery,
      username: user.username
    });

    expect(response.data).not.toBeNull();
    expect((<MyHabitsQueryResult>response.data).myHabits.length).toEqual(user.habits.length);
    expect((<MyHabitsQueryResult>response.data).myHabits.length).toEqual(0);
  });

  test('if user who is not logged in requests all his habits then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: myHabitsQuery
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('User is not logged in');
  });

  test('if user who doesnt exist requests all his habits then it should throw error "EntityNotFound: Could not find any entity of type User"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: myHabitsQuery,
      username: 'idontexist'
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type "User"');
  });

  test('if user removes a habit it has then it should return deleted habit', async () => {
    expect.assertions(2);

    const habit1 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    const habit2 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    const habit3 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    await habitRepository.save(habit1);
    const savedHabit2 = await habitRepository.save(habit2);
    await habitRepository.save(habit3);

    const user = userRepository.create({
      email: 'supernew@email.com',
      password: generatePassword(),
      username: generateUsername(),
      firstname: generateName(),
      lastname: generateName(),
      habits: [habit1, habit2, habit3]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: removeHabitMutation,
      username: user.username,
      variableValues: { data: { id: savedHabit2.id } }
    });

    expect(response.data).not.toBeNull();
    expect((<RemoveHabitMutationResult>response.data).removeHabit.habit.id).toEqual(savedHabit2.id.toString());
  });

  test('if user removes a habit it doesnt have then it should fail', async () => {
    expect.assertions(4);

    const habit1 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    const habit2 = habitRepository.create({
      title: generateTitle(),
      description: generateDescription(),
      startDate: generateDate().toISOString()
    });
    await habitRepository.save(habit1);
    const savedHabit2 = await habitRepository.save(habit2);

    const user = userRepository.create({
      email: generateEmail(),
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName(),
      habits: [habit1]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: removeHabitMutation,
      username: user.username,
      variableValues: { data: { id: savedHabit2.id } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual(`Habit with the ID ${savedHabit2.id} does not exist`);
  });

  test('if user who is not logged in removes a habit then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: removeHabitMutation,
      variableValues: { data: { id: 1 } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('User is not logged in');
  });

  test('if user who doesnt exist removes a habit then it should throw error "EntityNotFound: Could not find any entity of type User"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: removeHabitMutation,
      username: 'idontexist',
      variableValues: { data: { id: 1 } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type "User"');
  });
});
