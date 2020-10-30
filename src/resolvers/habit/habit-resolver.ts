import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Habit } from '../../entities/habit';
import { User } from '../../entities/user';
import { AddHabitInput } from './habit-input';

@Resolver(Habit)
export class HabitResolver {
  constructor(
    @InjectRepository(Habit) private readonly habitRepository: Repository<Habit>,
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  @Query(() => [Habit])
  habits(): Promise<Habit[]> {
    return this.habitRepository.find({
      relations: ['user', 'entries']
    });
  }

  @Mutation(() => Habit)
  async addHabit(@Arg('data') data: AddHabitInput): Promise<Habit> {
    const user = await this.userRepository.findOne(data.userId);

    if (!user) {
      throw Error('gg');
    }

    const habit = this.habitRepository.create({
      user: user,
      description: data.description,
      title: data.title,
      startDate: data.startDate,
      entries: []
    });

    return await this.habitRepository.save(habit);
  }

  @Mutation(() => Boolean)
  async removeHabit(@Arg('id') id: number): Promise<boolean> {
    try {
      await this.habitRepository.delete(id);
      return true;
    } catch {
      return false;
    }
  }
}
