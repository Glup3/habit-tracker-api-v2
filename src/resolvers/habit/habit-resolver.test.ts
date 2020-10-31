/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Connection, Repository } from 'typeorm';

import { testConnection } from '../../test_utils/test-database';
import { gCall } from '../../test_utils/gCall';
import {
  generateDate,
  generateDescription,
  generateEmail,
  generateName,
  generatePassword,
  generateTitle
} from '../../test_utils/data-generator';
import { User } from '../../entities/user';
import { Habit } from '../../entities/habit';

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
      title
      description
      startDate
    }
  }
`;

const habitQuery = `
  query Habit($id: Int!) {
    habit(id: $id) {
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
  mutation RemoveHabbit($id: Int!) {
    removeHabit(id: $id) {
      id
      title
      description
      startDate
    }
  }
`;

interface RemoveHabitMutationResult {
  removeHabit: Habit;
}

describe('Habit Resolver', () => {
  test('if adding multiple habits to the user then return the same habits', async () => {
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
    expect(habits).toBeDefined();
    expect(dbUser?.habits.length).toEqual(habits.length);
  });

  test('if habit from user by id returns habit', async () => {
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
      variableValues: { id: h1.id }
    });

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

  test('if getting habits from user works properly', async () => {
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

    const dbUser = await userRepository.findOne({ where: { username: user1.username }, relations: ['habits'] });
    expect((<MyHabitsQueryResult>response.data).myHabits.length).toEqual(dbUser?.habits.length);
  });

  test('if user removes its own habit then it should succeed', async () => {
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
      email: generateEmail(),
      password: generatePassword(),
      username: generateName(),
      firstname: generateName(),
      lastname: generateName(),
      habits: [habit1, habit2, habit3]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: removeHabitMutation,
      username: user.username,
      variableValues: { id: savedHabit2.id }
    });

    expect((<RemoveHabitMutationResult>response.data).removeHabit.id).toEqual(savedHabit2.id.toString());
  });

  test('if user removes a habit it doesnt have then it should fail', async () => {
    expect.assertions(3);

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
      variableValues: { id: savedHabit2.id }
    });

    expect(response.data).toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors![0].message).toEqual(`Habit with the ID ${savedHabit2.id} does not exist`);
  });
});
