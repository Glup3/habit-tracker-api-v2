import { NextFunction, Response, Request } from 'express';
import { verify } from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import {
  ACCESS_TOKEN_EXPIRE_TIME,
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  REFRESH_TOKEN_EXPIRE_TIME
} from '../constants';
import { User } from '../entities/user';
import { createTokens } from '../auth';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const refreshToken = req.cookies[COOKIE_REFRESH_TOKEN];
  const accessToken = req.cookies[COOKIE_ACCESS_TOKEN];

  if (!refreshToken && !accessToken) {
    return next();
  }

  try {
    const data = verify(accessToken, <string>process.env.JWT_ACCESS_SECRET) as { username: string };
    req.username = data.username;
    return next();
  } catch {}

  if (!refreshToken) {
    return next();
  }

  let data;

  try {
    data = verify(refreshToken, <string>process.env.JWT_REFRESH_SECRET) as { username: string; tokenCount: number };
  } catch {
    return next();
  }

  if (!data.username) {
    return next();
  }

  const userRepository = getRepository(User);
  const user = await userRepository.findOne({ username: data.username });

  if (!user || user.tokenCount !== data.tokenCount) {
    return next();
  }

  const tokens = createTokens(user);
  res.cookie(COOKIE_REFRESH_TOKEN, tokens.refreshToken, { maxAge: 1000 * REFRESH_TOKEN_EXPIRE_TIME, httpOnly: true });
  res.cookie(COOKIE_ACCESS_TOKEN, tokens.accessToken, { maxAge: 1000 * ACCESS_TOKEN_EXPIRE_TIME });
  req.username = user.username;

  next();
};
