import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import bcrypt from 'bcryptjs';

import { User } from '../../entities/user';
import { Authenticated } from '../../middlewares/authenticated';
import { Context } from '../../types/context.interface';
import { UpdateEmailInput, UpdatePasswordInput } from './user-input';
import { invalidateTokens } from '../../auth';
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from '../../constants';

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
  async removeUser(@Arg('id') id: number): Promise<boolean> {
    try {
      await this.userRepository.delete(id);
      return true;
    } catch {
      return false;
    }
  }
}
