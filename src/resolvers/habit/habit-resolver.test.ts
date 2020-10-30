import { Connection, Repository } from 'typeorm';
import faker from 'faker';

import { testConnection } from '../../test_utils/test-database';
import { gCall } from '../../test_utils/gCall';
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
  query Habit($id: Float!) {
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

describe('Habit Resolver', () => {
  test('if adding multiple habits to the logged in user works properly', async () => {
    const user = {
      email: faker.internet.email(),
      password: faker.internet.password(),
      username: faker.name.findName(),
      firstname: faker.name.firstName(),
      lastname: faker.name.lastName()
    };
    const habit1 = {
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      startDate: faker.date.recent().toISOString()
    };
    const habit2 = {
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      startDate: faker.date.soon().toISOString()
    };
    const habit3 = {
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      startDate: faker.date.recent().toISOString()
    };

    const newUser = userRepository.create({
      ...user,
      habits: []
    });

    userRepository.save(newUser);
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
    expect(dbUser?.habits.length).toEqual(habits.length);
  });

  test('if habit from user by id returns habit', async () => {
    const habit1 = habitRepository.create({
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      startDate: faker.date.recent().toISOString()
    });
    const habit2 = habitRepository.create({
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      startDate: faker.date.recent().toISOString()
    });

    const h1 = await habitRepository.save(habit1);
    await habitRepository.save(habit2);

    const user = userRepository.create({
      email: faker.internet.email(),
      password: faker.internet.password(),
      username: faker.name.findName(),
      firstname: faker.name.firstName(),
      lastname: faker.name.lastName(),
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
});
