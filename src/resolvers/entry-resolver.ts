import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Entry } from '../entities/entry';
import { Habit } from '../entities/habit';
import { AddEntryInput } from './types/entry-input';

@Resolver(Entry)
export class EntryResolver {
  constructor(
    @InjectRepository(Entry) private readonly entryRepository: Repository<Entry>,
    @InjectRepository(Habit) private readonly habitRepository: Repository<Habit>
  ) {}

  @Query(() => [Entry])
  entries(): Promise<Entry[]> {
    return this.entryRepository.find({ relations: ['habit'] });
  }

  @Mutation(() => Entry)
  async addEntry(@Arg('data') data: AddEntryInput): Promise<Entry> {
    const habit = await this.habitRepository.findOne(data.habitId);
    const entry = this.entryRepository.create({
      habit,
      entryDate: data.entryDate
    });
    return await this.entryRepository.save(entry);
  }

  @Mutation(() => Boolean)
  async removeEntry(@Arg('id') id: number): Promise<boolean> {
    try {
      //TODO check if user has access
      await this.entryRepository.delete(id);
      return true;
    } catch {
      return false;
    }
  }
}
