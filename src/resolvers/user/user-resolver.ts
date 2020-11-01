import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import bcrypt from 'bcryptjs';

import { User } from '../../entities/user';
import { Authenticated } from '../../middlewares/authenticated';
import { Context } from '../../types/context.interface';
import {
  UpdateEmailInput,
  UpdateMeInput,
  UpdatePasswordInput,
  UpdateUsernameInput,
  DeleteMyAccountInput
} from './user-input';
import { invalidateTokens } from '../../auth';
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from '../../constants';
import { DeleteMyAccountPayload } from './user-types';

@Resolver(User)
export class UserResolver {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  @Query(() => [User])
  users(): Promise<User[]> {
    return this.userRepository.find({ relations: ['habits'] });
  }

  @Mutation(() => Boolean)
  @UseMiddleware(Authenticated)
  async updatePassword(@Arg('data') data: UpdatePasswordInput, @Ctx() ctx: Context): Promise<boolean> {
    const user = await this.userRepository.findOneOrFail({ username: ctx.req.username });
    const hashedPassword = await bcrypt.hash(data.password, 10);
    user.password = hashedPassword;

    await this.userRepository.save(user);

    await invalidateTokens(ctx.req.username);
    ctx.res.cookie(COOKIE_REFRESH_TOKEN, { maxAge: 0 });
    ctx.res.cookie(COOKIE_ACCESS_TOKEN, { maxAge: 0 });

    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(Authenticated)
  async updateEmail(@Arg('data') data: UpdateEmailInput, @Ctx() ctx: Context): Promise<boolean> {
    const usedEmailUser = await this.userRepository.findOne({ email: data.email });
    if (usedEmailUser) {
      return false;
    }

    const user = await this.userRepository.findOneOrFail({ username: ctx.req.username });
    user.email = data.email;

    await this.userRepository.save(user);

    await invalidateTokens(ctx.req.username);
    ctx.res.cookie(COOKIE_REFRESH_TOKEN, { maxAge: 0 });
    ctx.res.cookie(COOKIE_ACCESS_TOKEN, { maxAge: 0 });

    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(Authenticated)
  async updateUsername(@Arg('data') data: UpdateUsernameInput, @Ctx() ctx: Context): Promise<boolean> {
    const usedUsernameUser = await this.userRepository.findOne({ username: data.username });
    if (usedUsernameUser) {
      return false;
    }

    const user = await this.userRepository.findOneOrFail({ username: ctx.req.username });
    user.username = data.username;

    await invalidateTokens(ctx.req.username);
    await this.userRepository.save(user);

    ctx.res.cookie(COOKIE_REFRESH_TOKEN, { maxAge: 0 });
    ctx.res.cookie(COOKIE_ACCESS_TOKEN, { maxAge: 0 });

    return true;
  }

  @Mutation(() => User)
  @UseMiddleware(Authenticated)
  async updateMe(@Arg('data') data: UpdateMeInput, @Ctx() ctx: Context): Promise<User> {
    const user = await this.userRepository.findOneOrFail({ username: ctx.req.username });

    if (!data.firstname && !data.lastname) {
      return user;
    }

    if (data.firstname) {
      user.firstname = data.firstname;
    }
    if (data.lastname) {
      user.lastname = data.lastname;
    }
    await this.userRepository.save(user);

    return user;
  }

  @Mutation(() => DeleteMyAccountPayload)
  @UseMiddleware(Authenticated)
  async deleteMyAccount(@Arg('data') data: DeleteMyAccountInput, @Ctx() ctx: Context): Promise<DeleteMyAccountPayload> {
    const user = await this.userRepository.findOneOrFail({ username: ctx.req.username });
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    const userId = user.id;

    if (!isPasswordValid) {
      throw new Error('Password is incorrect');
    }

    const deletedUser = await this.userRepository.remove(user);
    deletedUser.id = userId;

    ctx.res.cookie(COOKIE_REFRESH_TOKEN, { maxAge: 0 });
    ctx.res.cookie(COOKIE_ACCESS_TOKEN, { maxAge: 0 });

    return { user: deletedUser };
  }
}
