import { Arg, FieldResolver, Mutation, Query, Resolver, Root, UseMiddleware } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

import { Entry } from '../../entities/entry';
import { Habit } from '../../entities/habit';
import { Authenticated } from '../../middlewares/authenticated';
import { HabitOwner } from '../../middlewares/habitOwner';
import { EntriesForMonthInput, ToggleEntryInput } from './entry-input';
import { ToggleEntryPayload, ToggleState } from './entry-types';

@Resolver(Entry)
export class EntryResolver {
  constructor(
    @InjectRepository(Entry) private readonly entryRepository: Repository<Entry>,
    @InjectRepository(Habit) private readonly habitRepository: Repository<Habit>
  ) {}

  @Query(() => [Entry])
  entries(): Promise<Entry[]> {
    return this.entryRepository.find();
  }

  @Query(() => [Entry])
  @UseMiddleware(Authenticated, HabitOwner)
  async entriesForMonth(@Arg('data') data: EntriesForMonthInput): Promise<Entry[]> {
    const habit = await this.habitRepository.findOneOrFail(data.habitId);
    return this.entryRepository.find({
      where: {
        habit: habit,
        year: data.year,
        month: data.month
      }
    });
  }
  //TODO test this

  @Mutation(() => ToggleEntryPayload)
  @UseMiddleware(Authenticated, HabitOwner)
  async toggleEntry(@Arg('data') data: ToggleEntryInput): Promise<ToggleEntryPayload> {
    const habit = await this.habitRepository.findOneOrFail(data.habitId);
    const findEntry = await this.entryRepository.findOne({
      where: {
        habit: habit,
        year: data.year,
        month: data.month,
        day: data.day
      }
    });

    if (!findEntry) {
      const entry = this.entryRepository.create({
        habit: habit,
        year: data.year,
        month: data.month,
        day: data.day
      });
      await this.entryRepository.save(entry);

      return {
        entry: entry,
        toggleState: ToggleState.ADDED
      };
    }

    const entry = await this.entryRepository.remove(findEntry);

    return {
      entry: entry,
      toggleState: ToggleState.REMOVED
    };
  }

  @FieldResolver()
  async habit(@Root() entry: Entry): Promise<Habit> {
    const foundEntry = await this.entryRepository.findOneOrFail({ where: { id: entry.id }, relations: ['habit'] });

    if (!foundEntry.habit) {
      throw new Error(`Couldnt find Habit for Entry ID ${entry.id}`);
    }

    return foundEntry.habit;
  }
  //TODO test this
}
