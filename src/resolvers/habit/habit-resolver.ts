import { Arg, Ctx, FieldResolver, Mutation, Query, Resolver, Root, UseMiddleware } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Entry } from '../../entities/entry';
import { Habit } from '../../entities/habit';
import { User } from '../../entities/user';
import { Authenticated } from '../../middlewares/authenticated';
import { HabitOwner } from '../../middlewares/habitOwner';
import { Context } from '../../types/context.interface';
import { AddHabitInput, HabitInput, RemoveHabitInput, UpdateHabitInput } from './habit-input';
import { AddHabitPayload, RemoveHabitPayload, UpdateHabitPayload } from './habit-types';

@Resolver(Habit)
export class HabitResolver {
  constructor(
    @InjectRepository(Habit) private readonly habitRepository: Repository<Habit>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Entry) private readonly entryRepository: Repository<Entry>
  ) {}

  @Query(() => [Habit])
  @UseMiddleware(Authenticated)
  async myHabits(@Ctx() ctx: Context): Promise<Habit[]> {
    const user = await this.userRepository.findOneOrFail({ username: ctx.req.username });
    return this.habitRepository.find({ where: { user }, order: { title: 'ASC' } });
  }

  @Query(() => Habit)
  @UseMiddleware(Authenticated, HabitOwner)
  habit(@Arg('data') data: HabitInput): Promise<Habit> {
    return this.habitRepository.findOneOrFail({ where: { id: data.habitId } });
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
    const habit = await this.habitRepository.findOneOrFail(data.habitId);
    const deletedHabit = await this.habitRepository.remove(habit);
    deletedHabit.id = data.habitId;

    return { habit: deletedHabit };
  }

  @Mutation(() => UpdateHabitPayload)
  @UseMiddleware(Authenticated, HabitOwner)
  async updateHabit(@Arg('data') data: UpdateHabitInput): Promise<UpdateHabitPayload> {
    const habit = await this.habitRepository.findOneOrFail(data.habitId);

    if (!data.title && !data.description && !data.startDate) {
      return { habit };
    }

    if (data.title) {
      habit.title = data.title;
    }

    if (data.description) {
      habit.description = data.description;
    }

    if (data.startDate) {
      habit.startDate = data.startDate;
    }

    await this.habitRepository.save(habit);

    return { habit };
  }

  @FieldResolver()
  async user(@Root() habit: Habit): Promise<User> {
    const foundHabit = await this.habitRepository.findOneOrFail({ where: { id: habit.id }, relations: ['user'] });

    if (!foundHabit.user) {
      throw new Error(`Couldnt find User for Habit ID ${habit.id}`);
    }

    return foundHabit.user;
  }

  @FieldResolver()
  async entries(@Root() habit: Habit): Promise<Entry[]> {
    const entries = await this.entryRepository.find({ where: { habit: habit } });
    if (!entries) {
      throw new Error(`Couldnt find entries for Habit ID ${habit.id}`);
    }

    return entries;
  }
}
