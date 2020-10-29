import { sign } from 'jsonwebtoken';
import { getRepository } from 'typeorm';

import { ACCESS_TOKEN_EXPIRE_TIME, REFRESH_TOKEN_EXPIRE_TIME } from './constants';
import { User } from './entities/user';

export const createTokens = (user: User): { refreshToken: string; accessToken: string } => {
  const refreshToken = sign(
    {
      username: user.username,
      tokenCount: user.tokenCount
    },
    <string>process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRE_TIME
    }
  );

  const accessToken = sign(
    {
      username: user.username
    },
    <string>process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRE_TIME
    }
  );

  return { refreshToken, accessToken };
};

export const invalidateTokens = async (username: string): Promise<boolean> => {
  if (!username) {
    return false;
  }

  const userRepository = getRepository(User);
  const user = await userRepository.findOneOrFail({ username });

  if (!user) {
    return false;
  }

  user.tokenCount += 1;
  await userRepository.save(user);

  return true;
};
