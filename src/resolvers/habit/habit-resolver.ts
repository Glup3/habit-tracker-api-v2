import { Arg, Ctx, Int, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Habit } from '../../entities/habit';
import { User } from '../../entities/user';
import { Authenticated } from '../../middlewares/authenticated';
import { HabitOwner } from '../../middlewares/habitOwner';
import { Context } from '../../types/context.interface';
import { AddHabitInput } from './habit-input';

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
  habit(@Arg('id', () => Int) id: number): Promise<Habit> {
    return this.habitRepository.findOneOrFail(id, { relations: ['entries'] });
  }

  @Mutation(() => Habit)
  @UseMiddleware(Authenticated)
  async addHabit(@Arg('data') data: AddHabitInput, @Ctx() ctx: Context): Promise<Habit> {
    const user = await this.userRepository.findOneOrFail({ username: ctx.req.username });

    const habit = this.habitRepository.create({
      user: user,
      description: data.description,
      title: data.title,
      startDate: data.startDate,
      entries: []
    });

    return await this.habitRepository.save(habit);
  }

  @Mutation(() => Habit)
  @UseMiddleware(Authenticated, HabitOwner)
  async removeHabit(@Arg('id', (type) => Int) id: number): Promise<Habit> {
    const habit = await this.habitRepository.findOneOrFail(id);
    const deletedHabit = await this.habitRepository.remove(habit);
    deletedHabit.id = id;

    return deletedHabit;
  }
}
