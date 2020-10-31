import { MiddlewareInterface, NextFn, ResolverData } from 'type-graphql';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { User } from '../entities/user';
import { Context } from '../types/context.interface';

@Service()
export class HabitOwner implements MiddlewareInterface<Context> {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

  async use({ args, context }: ResolverData<Context>, next: NextFn): Promise<NextFn> {
    const user = await this.userRepository.findOneOrFail({
      where: { username: context.req.username },
      relations: ['habits']
    });

    let isOwner = false;

    user.habits.forEach((habit) => {
      if (habit.id === <number>args.id) {
        isOwner = true;
        return;
      }
    });

    if (!isOwner) {
      throw new Error(`Habit with the ID ${args.id} does not exist`);
    }

    return next();
  }
}
