import { Connection, Repository } from 'typeorm';
import { Maybe } from 'graphql/jsutils/Maybe';
import { ArgumentValidationError } from 'type-graphql';

import { testConnection } from '../../test_utils/test-database';
import { gCall } from '../../test_utils/gCall';
import { DataGenerator } from '../../test_utils/data-generator';
import { User } from '../../entities/user';
import { Habit } from '../../entities/habit';

let conn: Connection;
let dataGenerator: DataGenerator;
let userRepository: Repository<User>;
let habitRepository: Repository<Habit>;

beforeAll(async () => {
  conn = await testConnection();
  userRepository = conn.getRepository(User);
  habitRepository = conn.getRepository(Habit);
  dataGenerator = new DataGenerator(12345);
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
      title
      description
      startDate
    }
  }
`;

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

const updateHabitMutation = `
  mutation UpdateHabit($data: UpdateHabitInput!) {
    updateHabit(data:$data) {
      habit {
        id
        title
        description
        startDate
      }
    }
  } 
`;

// console.log((<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints);

describe('Habit Resolver', () => {
  test('if user adds habit with valid title, valid description and valid startDate then it should return created habit', async () => {
    expect.assertions(1);

    const habit = {
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    };
    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: []
    });
    await userRepository.save(user);

    const response = await gCall({
      source: addHabitMutation,
      variableValues: { data: habit },
      username: user.username
    });

    expect(response).toMatchObject({
      data: {
        addHabit: {
          habit: {
            title: habit.title,
            description: habit.description,
            startDate: habit.startDate
          }
        }
      }
    });
  });

  test('if user adds habit with valid title, no description and valid startDate then it should return created habit', async () => {
    expect.assertions(1);

    const habit = {
      title: dataGenerator.generateTitle(),
      startDate: dataGenerator.generateDate().toISOString()
    };
    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: 'another_user1',
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: []
    });
    await userRepository.save(user);

    const response = await gCall({
      source: addHabitMutation,
      variableValues: { data: habit },
      username: user.username
    });

    expect(response).toMatchObject({
      data: {
        addHabit: {
          habit: {
            title: habit.title,
            description: null,
            startDate: habit.startDate
          }
        }
      }
    });
  });

  test('if user adds habit with too long title, valid description and valid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = {
      title: dataGenerator.generateTitle(65),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
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
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('title must be shorter than or equal to 64 characters');
  });

  test('if user adds habit with valid title, too long description and valid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = {
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(256),
      startDate: dataGenerator.generateDate().toISOString()
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
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('description must be shorter than or equal to 255 characters');
  });

  test('if user adds habit with valid title, valid description and invalid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(4);

    const habit = {
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: 'not a date'
    };
    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: 'superunqiue_1312',
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: []
    });
    await userRepository.save(user);

    const response = await gCall({
      source: addHabitMutation,
      variableValues: { data: habit },
      username: user.username
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('invalid input syntax for type timestamp');
  });

  test('if user who is not logged in adds a valid habit then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const habit = {
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
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
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
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
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    };
    const habit2 = {
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    };
    const habit3 = {
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    };
    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
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
    expect.assertions(1);

    const habit1 = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const habit2 = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });

    const h1 = await habitRepository.save(habit1);
    await habitRepository.save(habit2);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit1, habit2]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: habitQuery,
      username: user.username,
      variableValues: { data: { habitId: h1.id } }
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

  test('if user requests a habit he does not own by id then it should throw error "Habit with the ID does not exist"', async () => {
    expect.assertions(4);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);
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
      source: habitQuery,
      username: user.username,
      variableValues: { data: { habitId: savedHabit.id } }
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
      variableValues: { data: { habitId: 1 } }
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
      variableValues: { data: { habitId: 1 } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type "User"');
  });

  test('if user requests all his habits then it should return all his habits', async () => {
    expect.assertions(1);

    const habit1 = habitRepository.create({
      title: 'title1',
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const habit2 = habitRepository.create({
      title: 'title2',
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const habit3 = habitRepository.create({
      title: 'title3',
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const habit4 = habitRepository.create({
      title: 'title4',
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const habit5 = habitRepository.create({
      title: 'title5',
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });

    await habitRepository.save(habit1);
    await habitRepository.save(habit2);
    await habitRepository.save(habit3);
    await habitRepository.save(habit4);
    await habitRepository.save(habit5);

    const user1 = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit1, habit2, habit4, habit5]
    });
    const user2 = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit3]
    });
    await userRepository.save(user1);
    await userRepository.save(user2);

    const response = await gCall({
      source: myHabitsQuery,
      username: user1.username
    });

    expect(response).toMatchObject({
      data: {
        myHabits: [
          {
            title: habit1.title,
            description: habit1.description,
            startDate: habit1.startDate
          },
          {
            title: habit2.title,
            description: habit2.description,
            startDate: habit2.startDate
          },
          {
            title: habit4.title,
            description: habit4.description,
            startDate: habit4.startDate
          },
          {
            title: habit5.title,
            description: habit5.description,
            startDate: habit5.startDate
          }
        ]
      }
    });
  });

  test('if user doesnt have habits and requests all his habits then it should return empty array', async () => {
    expect.assertions(1);

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
      source: myHabitsQuery,
      username: user.username
    });

    expect(response).toMatchObject({
      data: {
        myHabits: []
      }
    });
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

  test('if user who doesnt exist requests all his habits then it should return error "EntityNotFound: Could not find any entity of type User"', async () => {
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
    expect.assertions(1);

    const habit1 = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const habit2 = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const habit3 = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    await habitRepository.save(habit1);
    const savedHabit2 = await habitRepository.save(habit2);
    await habitRepository.save(habit3);

    const user = userRepository.create({
      email: 'supernew@email.com',
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit1, habit2, habit3]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: removeHabitMutation,
      username: user.username,
      variableValues: { data: { habitId: savedHabit2.id } }
    });

    expect(response).toMatchObject({
      data: {
        removeHabit: {
          habit: {
            id: savedHabit2.id.toString(),
            title: savedHabit2.title,
            description: savedHabit2.description,
            startDate: savedHabit2.startDate
          }
        }
      }
    });
  });

  test('if user removes a habit it doesnt have then it should return error "Habit with the ID does not exist"', async () => {
    expect.assertions(4);

    const habit1 = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const habit2 = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    await habitRepository.save(habit1);
    const savedHabit2 = await habitRepository.save(habit2);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateName(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit1]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: removeHabitMutation,
      username: user.username,
      variableValues: { data: { habitId: savedHabit2.id } }
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
      variableValues: { data: { habitId: 1 } }
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
      variableValues: { data: { habitId: 1 } }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type "User"');
  });

  test('if user updates habit he owns with valid title, valid description and valid startDate then it should return updated habit', async () => {
    expect.assertions(1);

    const title = 'Dancing KPOP';
    const description = 'Dancing KPOP songs for atleast 60 minutes';
    const startDate = '2020-02-07T21:04:39.573Z';

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: title,
          description: description,
          startDate: startDate
        }
      }
    });

    expect(response).toMatchObject({
      data: {
        updateHabit: {
          habit: {
            id: savedHabit.id.toString(),
            title: title,
            description: description,
            startDate: startDate
          }
        }
      }
    });
  });

  test('if user updates habit he owns with only valid title then it should return updated habit', async () => {
    expect.assertions(1);

    const title = 'Dancing KPOP';

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: title
        }
      }
    });

    expect(response).toMatchObject({
      data: {
        updateHabit: {
          habit: {
            id: savedHabit.id.toString(),
            title: title,
            description: savedHabit.description,
            startDate: savedHabit.startDate
          }
        }
      }
    });
  });

  test('if user updates habit he owns with only valid description then it should return updated habit', async () => {
    expect.assertions(1);

    const description = 'Dancing KPOP songs for atleast 60 minutes';

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          description: description
        }
      }
    });

    expect(response).toMatchObject({
      data: {
        updateHabit: {
          habit: {
            id: savedHabit.id.toString(),
            title: savedHabit.title,
            description: description,
            startDate: savedHabit.startDate
          }
        }
      }
    });
  });

  test('if user updates habit he owns with only valid startDate then it should return updated habit', async () => {
    expect.assertions(1);

    const startDate = '2020-02-07T21:04:39.573Z';

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          startDate: startDate
        }
      }
    });

    expect(response).toMatchObject({
      data: {
        updateHabit: {
          habit: {
            id: savedHabit.id.toString(),
            title: savedHabit.title,
            description: savedHabit.description,
            startDate: startDate
          }
        }
      }
    });
  });

  test('if user updates habit he owns with no title, no description and no startDate then it should return unchanged habit', async () => {
    expect.assertions(1);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id
        }
      }
    });

    expect(response).toMatchObject({
      data: {
        updateHabit: {
          habit: {
            id: savedHabit.id.toString(),
            title: savedHabit.title,
            description: savedHabit.description,
            startDate: savedHabit.startDate
          }
        }
      }
    });
  });

  test('if user updates habit he owns with too long title, valid description and valid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(65),
          description: dataGenerator.generateDescription(),
          startDate: dataGenerator.generateDate().toISOString()
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('title must be shorter than or equal to 64 characters');
  });

  test('if user updates habit he owns with too long title, no description and valid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(65),
          startDate: dataGenerator.generateDate().toISOString()
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('title must be shorter than or equal to 64 characters');
  });

  test('if user updates habit he owns with too long title, no description and no startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(65)
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('title must be shorter than or equal to 64 characters');
  });

  test('if user updates habit he owns with too long title, valid description and no startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(65),
          description: dataGenerator.generateDescription()
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('title must be shorter than or equal to 64 characters');
  });

  test('if user updates habit he owns with valid title, too long description and valid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(),
          description: dataGenerator.generateDescription(256),
          startDate: dataGenerator.generateDate().toISOString()
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('description must be shorter than or equal to 255 characters');
  });

  test('if user updates habit he owns with valid title, too long description and no startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(),
          description: dataGenerator.generateDescription(256)
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('description must be shorter than or equal to 255 characters');
  });

  test('if user updates habit he owns with no title, too long description and valid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          description: dataGenerator.generateDescription(256),
          startDate: dataGenerator.generateDate().toISOString()
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('description must be shorter than or equal to 255 characters');
  });

  test('if user updates habit he owns with no title, too long description and no startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          description: dataGenerator.generateDescription(256)
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('description must be shorter than or equal to 255 characters');
  });

  test('if user updates habit he owns with valid title, valid description and invalid startDate then it should return updated habit', async () => {
    expect.assertions(4);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(),
          description: dataGenerator.generateDescription(),
          startDate: 'invalid date'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('invalid input syntax for type timestamp');
  });

  test('if user updates habit he owns with valid title, no description and invalid startDate then it should return error "invalid input syntax for type timestamp"', async () => {
    expect.assertions(4);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(),
          startDate: 'invalid date'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('invalid input syntax for type timestamp');
  });

  test('if user updates habit he owns with no title, valid description and invalid startDate then it should return error "invalid input syntax for type timestamp"', async () => {
    expect.assertions(4);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          description: dataGenerator.generateDescription(),
          startDate: 'invalid date'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('invalid input syntax for type timestamp');
  });

  test('if user updates habit he owns with no title, no description and invalid startDate then it should return error "invalid input syntax for type timestamp"', async () => {
    expect.assertions(4);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          startDate: 'invalid date'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('invalid input syntax for type timestamp');
  });

  test('if user updates habit he owns with too long title, too long description and valid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(6);

    const startDate = '2020-02-07T21:04:39.573Z';

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(65),
          description: dataGenerator.generateDescription(256),
          startDate: startDate
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('title must be shorter than or equal to 64 characters');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.maxLength
    ).toEqual('description must be shorter than or equal to 255 characters');
  });

  test('if user updates habit he owns with too long title, too long description and invalid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(6);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(65),
          description: dataGenerator.generateDescription(256),
          startDate: 'invalid date'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('title must be shorter than or equal to 64 characters');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.maxLength
    ).toEqual('description must be shorter than or equal to 255 characters');
  });

  test('if user updates habit he owns with too long title, valid description and invalid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(65),
          description: dataGenerator.generateDescription(),
          startDate: 'invalid date'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('title must be shorter than or equal to 64 characters');
  });

  test('if user updates habit he owns with valid title, too long description and invalid startDate then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: [habit]
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(),
          description: dataGenerator.generateDescription(256),
          startDate: 'invalid date'
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.maxLength
    ).toEqual('description must be shorter than or equal to 255 characters');
  });

  test('if user updates habit he doesnt own with valid title, valid description and valid startDate then it should return error "Habit with the ID does not exist"', async () => {
    expect.assertions(4);

    const title = 'Dancing KPOP';
    const description = 'Dancing KPOP songs for atleast 60 minutes';
    const startDate = '2020-02-07T21:04:39.573Z';

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: []
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: title,
          description: description,
          startDate: startDate
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual(`Habit with the ID ${savedHabit.id} does not exist`);
  });

  test('if user updates habit he doesnt own with too long title, valid description and valid startDate then it should return error "Habit with the ID does not exist"', async () => {
    expect.assertions(4);

    const description = 'Dancing KPOP songs for atleast 60 minutes';
    const startDate = '2020-02-07T21:04:39.573Z';

    const habit = habitRepository.create({
      title: dataGenerator.generateTitle(),
      description: dataGenerator.generateDescription(),
      startDate: dataGenerator.generateDate().toISOString()
    });
    const savedHabit = await habitRepository.save(habit);

    const user = userRepository.create({
      email: dataGenerator.generateEmail(),
      password: dataGenerator.generatePassword(),
      username: dataGenerator.generateUsername(),
      firstname: dataGenerator.generateName(),
      lastname: dataGenerator.generateName(),
      habits: []
    });
    await userRepository.save(user);

    const response = await gCall({
      source: updateHabitMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: savedHabit.id,
          title: dataGenerator.generateTitle(65),
          description: description,
          startDate: startDate
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual(`Habit with the ID ${savedHabit.id} does not exist`);
  });

  test('if user updates habit when he is not logged in with valid title, valid description and valid startDate and then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateHabitMutation,
      variableValues: {
        data: {
          habitId: 999,
          title: dataGenerator.generateTitle(),
          description: dataGenerator.generateDescription(),
          startDate: dataGenerator.generateDate().toISOString()
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('User is not logged in');
  });

  test('if user who doesnt exist updates habit with valid title, valid description and valid startDate and then it should return error "Could not find any entity of type"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: updateHabitMutation,
      username: 'userdoesntexist',
      variableValues: {
        data: {
          habitId: 999,
          title: dataGenerator.generateTitle(),
          description: dataGenerator.generateDescription(),
          startDate: dataGenerator.generateDate().toISOString()
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type');
  });
});
