import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import bcrypt from 'bcryptjs';

import { User } from '../../entities/user';
import { LoginInput, RegisterInput } from './auth-input';
import { createTokens, invalidateTokens } from '../../auth';
import {
  ACCESS_TOKEN_EXPIRE_TIME,
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  REFRESH_TOKEN_EXPIRE_TIME
} from '../../constants';
import { Context } from '../../types/context.interface';
import { Authenticated } from '../../middlewares/authenticated';
import { LoginPayload, RegisterPayload } from './auth-types';

@Resolver(User)
export class AuthResolver {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  @Mutation(() => RegisterPayload)
  async register(@Arg('data') data: RegisterInput): Promise<RegisterPayload> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      username: data.username,
      firstname: data.firstname,
      lastname: data.lastname,
      habits: []
    });

    return {
      user: await this.userRepository.save(user)
    };
  }

  @Mutation(() => LoginPayload)
  async login(@Arg('data') data: LoginInput, @Ctx() ctx: Context): Promise<LoginPayload> {
    const user = await this.userRepository.findOne({ email: data.email });
    if (!user) {
      throw new Error('Email or Password is invalid');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email or Password is invalid');
    }

    const { accessToken, refreshToken } = createTokens(user);

    ctx.res.cookie(COOKIE_REFRESH_TOKEN, refreshToken, { maxAge: 1000 * REFRESH_TOKEN_EXPIRE_TIME, httpOnly: true });
    ctx.res.cookie(COOKIE_ACCESS_TOKEN, accessToken, { maxAge: 1000 * ACCESS_TOKEN_EXPIRE_TIME });

    return { user };
  }

  @Query(() => User)
  @UseMiddleware(Authenticated)
  me(@Ctx() ctx: Context): Promise<User> {
    return this.userRepository.findOneOrFail({ where: { username: ctx.req.username }, relations: ['habits'] });
  }

  @Mutation(() => Boolean)
  async revokeTokens(@Ctx() ctx: Context): Promise<boolean> {
    if (!ctx.req.username) {
      return false;
    }

    await invalidateTokens(ctx.req.username);

    return true;
  }
}
