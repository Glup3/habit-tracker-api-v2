import Chance from 'chance';

export class DataGenerator {
  chance: Chance.Chance;

  constructor(seed = 12345) {
    this.chance = Chance(seed);
  }

  generateUsername = (length = 31): string =>
    this.chance.string({ length, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' });

  generateName = (length = 16): string =>
    this.chance.string({ length, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' });

  generatePassword = (length = 16): string => this.chance.string({ length });

  generateEmail = (): string => `${this.generateName(16)}@${this.generateName(6)}.com`;

  generateDate = (): Date => this.chance.date();

  generateTitle = (length = 16): string =>
    this.chance.string({ length, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' });

  generateDescription = (length = 32): string =>
    this.chance.string({ length, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ' });
}
