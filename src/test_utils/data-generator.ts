import Chance from 'chance';

const chance = Chance(12345);

export const generateUsername = (length = 31): string =>
  chance.string({ length, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' });

export const generateName = (length = 16): string =>
  chance.string({ length, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' });

export const generatePassword = (length = 16): string => chance.string({ length });

export const generateEmail = (): string => `${generateName(16)}@${generateName(6)}.com`;

export const generateDate = (): Date => chance.date();

export const generateTitle = (length = 16): string =>
  chance.string({ length, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' });

export const generateDescription = (length = 32): string =>
  chance.string({ length, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ' });
