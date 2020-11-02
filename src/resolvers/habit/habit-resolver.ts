import { Arg, Ctx, Int, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Habit } from '../../entities/habit';
import { User } from '../../entities/user';
import { Authenticated } from '../../middlewares/authenticated';
import { HabitOwner } from '../../middlewares/habitOwner';
import { Context } from '../../types/context.interface';
import { AddHabitInput, HabitInput, RemoveHabitInput } from './habit-input';
import { AddHabitPayload, RemoveHabitPayload } from './habit-types';

@Resolver(Habit)
export class HabitResolver {
  constructor(
    @InjectRepository(Habit) private readonly habitRepository: Repository<Habit>,
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  @Query(() => [Habit])
  @UseMiddleware(Authenticated)
  async myHabits(@Ctx() ctx: Context): Promise<Habit[]> {
    const user = await this.userRepository.findOneOrFail({ username: ctx.req.username });
    return this.habitRepository.find({ where: { user }, relations: ['user', 'entries'], order: { title: 'ASC' } });
  }

  @Query(() => Habit)
  @UseMiddleware(Authenticated, HabitOwner)
  habit(@Arg('data') data: HabitInput): Promise<Habit> {
    return this.habitRepository.findOneOrFail({ where: { id: data.id }, relations: ['entries'] });
  }

  @Mutation(() => AddHabitPayload)
  @UseMiddleware(Authenticated)
  async addHabit(@Arg('data') data: AddHabitInput, @Ctx() ctx: Context): Promise<AddHabitPayload> {
    const user = await this.userRepository.findOneOrFail({ username: ctx.req.username });

    const habit = this.habitRepository.create({
      user: user,
      description: data.description,
      title: data.title,
      startDate: data.startDate,
      entries: []
    });

    return { habit: await this.habitRepository.save(habit) };
  }

  @Mutation(() => RemoveHabitPayload)
  @UseMiddleware(Authenticated, HabitOwner)
  async removeHabit(@Arg('data') data: RemoveHabitInput): Promise<RemoveHabitPayload> {
    const habit = await this.habitRepository.findOneOrFail(data.id);
    const deletedHabit = await this.habitRepository.remove(habit);
    deletedHabit.id = data.id;

    return { habit: deletedHabit };
  }
}
