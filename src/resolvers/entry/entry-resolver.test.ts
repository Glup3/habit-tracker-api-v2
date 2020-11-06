import { Connection, Repository } from 'typeorm';
import { Maybe } from 'graphql/jsutils/Maybe';
import { ArgumentValidationError } from 'type-graphql';

import { testConnection } from '../../test_utils/test-database';
import { gCall } from '../../test_utils/gCall';
import { DataGenerator } from '../../test_utils/data-generator';
import { User } from '../../entities/user';
import { Habit } from '../../entities/habit';
import { Entry } from '../../entities/entry';

let conn: Connection;
let dataGenerator: DataGenerator;
let userRepository: Repository<User>;
let habitRepository: Repository<Habit>;
let entryRepository: Repository<Entry>;

beforeAll(async () => {
  conn = await testConnection();
  userRepository = conn.getRepository(User);
  habitRepository = conn.getRepository(Habit);
  entryRepository = conn.getRepository(Entry);
  dataGenerator = new DataGenerator(22222);
});

afterAll(async () => {
  await conn.close();
});

const toggleEntryMutation = `
  mutation ToggleEntry($data: ToggleEntryInput!) {
    toggleEntry(data: $data) {
      toggleState
      entry {
        year
        month
        day
      }
    }
  }
`;

describe('Entry Resolver', () => {
  test('if user toggles not existing entry with valid year, valid month and valid day on a habit he owns then it should return created entry + toggleState ADDED', async () => {
    expect.assertions(1);

    const year = 2020;
    const month = 8;
    const day = 20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response).toMatchObject({
      data: {
        toggleEntry: {
          entry: {
            year: year,
            month: month,
            day: day
          },
          toggleState: 'ADDED'
        }
      }
    });
  });

  test('if user toggles not existing entry with valid year, valid month and invalid day (day < 0) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const year = 2020;
    const month = 8;
    const day = -20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.min
    ).toEqual('day must not be less than 0');
  });

  test('if user toggles not existing entry with valid year, valid month and invalid day (day > 31) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const year = 2020;
    const month = 8;
    const day = 32;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.max
    ).toEqual('day must not be greater than 31');
  });

  test('if user toggles not existing entry with valid year, invalid month (month < 0) and valid day on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const year = 2020;
    const month = -8;
    const day = 20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.min
    ).toEqual('month must not be less than 0');
  });

  test('if user toggles not existing entry with valid year, invalid month (month > 12) and valid day on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const year = 2020;
    const month = 13;
    const day = 20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.max
    ).toEqual('month must not be greater than 12');
  });

  test('if user toggles not existing entry with invalid year, valid month and valid day on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(5);

    const year = -2020;
    const month = 13;
    const day = 20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isPositive
    ).toEqual('year must be a positive number');
  });

  test('if user toggles not existing entry with valid year, invalid month (month > 12) and invalid day (day > 31) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(6);

    const year = 2020;
    const month = 13;
    const day = 32;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.max
    ).toEqual('month must not be greater than 12');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.max
    ).toEqual('day must not be greater than 31');
  });

  test('if user toggles not existing entry with valid year, invalid month (month < 0) and invalid day (day > 31) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(6);

    const year = 2020;
    const month = -8;
    const day = 32;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.min
    ).toEqual('month must not be less than 0');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.max
    ).toEqual('day must not be greater than 31');
  });

  test('if user toggles not existing entry with valid year, invalid month (month > 12) and invalid day (day < 0) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(6);

    const year = 2020;
    const month = 13;
    const day = -20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.max
    ).toEqual('month must not be greater than 12');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.min
    ).toEqual('day must not be less than 0');
  });

  test('if user toggles not existing entry with valid year, invalid month (month < 0) and invalid day (day < 0) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(6);

    const year = 2020;
    const month = -8;
    const day = -20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.min
    ).toEqual('month must not be less than 0');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.min
    ).toEqual('day must not be less than 0');
  });

  test('if user toggles not existing entry with invalid year, invalid month (month < 0) and valid day on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(6);

    const year = -2020;
    const month = -8;
    const day = 20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isPositive
    ).toEqual('year must be a positive number');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.min
    ).toEqual('month must not be less than 0');
  });

  test('if user toggles not existing entry with invalid year, invalid month (month > 12) and valid day on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(6);

    const year = -2020;
    const month = 13;
    const day = 20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isPositive
    ).toEqual('year must be a positive number');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.max
    ).toEqual('month must not be greater than 12');
  });

  test('if user toggles not existing entry with invalid year, valid month and invalid day (day < 0) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(6);

    const year = -2020;
    const month = 8;
    const day = -20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isPositive
    ).toEqual('year must be a positive number');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.min
    ).toEqual('day must not be less than 0');
  });

  test('if user toggles not existing entry with invalid year, valid month and invalid day (day > 31) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(6);

    const year = -2020;
    const month = 8;
    const day = 32;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isPositive
    ).toEqual('year must be a positive number');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.max
    ).toEqual('day must not be greater than 31');
  });

  test('if user toggles not existing entry with invalid year, invalid month (month > 12) and invalid day (day > 31) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(7);

    const year = -2020;
    const month = 13;
    const day = 32;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isPositive
    ).toEqual('year must be a positive number');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.max
    ).toEqual('month must not be greater than 12');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[2].constraints?.max
    ).toEqual('day must not be greater than 31');
  });

  test('if user toggles not existing entry with invalid year, invalid month (month < 0) and invalid day (day > 31) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(7);

    const year = -2020;
    const month = -8;
    const day = 32;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isPositive
    ).toEqual('year must be a positive number');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.min
    ).toEqual('month must not be less than 0');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[2].constraints?.max
    ).toEqual('day must not be greater than 31');
  });

  test('if user toggles not existing entry with invalid year, invalid month (month > 12) and invalid day (day < 0) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(7);

    const year = -2020;
    const month = 13;
    const day = -20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isPositive
    ).toEqual('year must be a positive number');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.max
    ).toEqual('month must not be greater than 12');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[2].constraints?.min
    ).toEqual('day must not be less than 0');
  });

  test('if user toggles not existing entry with invalid year, invalid month (month < 0) and invalid day (day < 0) on a habit he owns then it should return Argument Validation Error', async () => {
    expect.assertions(7);

    const year = -2020;
    const month = -8;
    const day = -20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual('Argument Validation Error');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[0].constraints?.isPositive
    ).toEqual('year must be a positive number');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[1].constraints?.min
    ).toEqual('month must not be less than 0');
    expect(
      (<Maybe<ArgumentValidationError>>response.errors?.[0].originalError)?.validationErrors[2].constraints?.min
    ).toEqual('day must not be less than 0');
  });

  test('if user toggles existing entry with valid year, valid month and valid day on a habit he owns then it should return removed entry + toggleState REMOVED', async () => {
    expect.assertions(1);

    const year = 2020;
    const month = 8;
    const day = 20;

    const entry = await entryRepository.save(
      entryRepository.create({
        year: year,
        month: month,
        day: day
      })
    );

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString(),
        entries: [entry]
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: 'superunqiue_1',
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: [habit]
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response).toMatchObject({
      data: {
        toggleEntry: {
          entry: {
            year: year,
            month: month,
            day: day
          },
          toggleState: 'REMOVED'
        }
      }
    });
  });

  test('if user toggles not existing entry with valid year, valid month and valid day on a habit he doesnt own then it should return error "Habit with the ID does not exist', async () => {
    expect.assertions(4);

    const year = 2020;
    const month = 8;
    const day = 20;

    const habit = await habitRepository.save(
      habitRepository.create({
        title: dataGenerator.generateTitle(),
        description: dataGenerator.generateDescription(),
        startDate: dataGenerator.generateDate().toISOString()
      })
    );

    const user = await userRepository.save(
      userRepository.create({
        email: dataGenerator.generateEmail(),
        password: dataGenerator.generatePassword(),
        username: dataGenerator.generateUsername(),
        firstname: dataGenerator.generateName(),
        lastname: dataGenerator.generateName(),
        habits: []
      })
    );

    const response = await gCall({
      source: toggleEntryMutation,
      username: user.username,
      variableValues: {
        data: {
          habitId: habit.id,
          year: year,
          month: month,
          day: day
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toEqual(`Habit with the ID ${habit.id} does not exist`);
  });

  test('if user who is not logged in toggles entry with valid year, valid month and valid day on a habit then it should return error "User is not logged in"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: toggleEntryMutation,
      variableValues: {
        data: {
          habitId: 999,
          year: 2020,
          month: 8,
          day: 20
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('User is not logged in');
  });

  test('if user who doesnt exist toggles entry with valid year, valid month and valid day on a habit then it should return error "Could not find any entity of type"', async () => {
    expect.assertions(4);

    const response = await gCall({
      source: toggleEntryMutation,
      username: 'userdoesntexist',
      variableValues: {
        data: {
          habitId: 999,
          year: 2020,
          month: 8,
          day: 20
        }
      }
    });

    expect(response.data).toBeNull();
    expect(response.errors).not.toBeNull();
    expect(response.errors?.length).toEqual(1);
    expect(response.errors?.[0].message).toContain('Could not find any entity of type');
  });
});
