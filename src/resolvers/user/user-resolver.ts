import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { User } from '../../entities/user';
import { AddUserInput } from './user-input';

@Resolver(User)
export class UserResolver {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  @Query(() => [User])
  users(): Promise<User[]> {
    return this.userRepository.find({ relations: ['habits'] });
  }

  @Mutation(() => User)
  async addUser(@Arg('data') data: AddUserInput): Promise<User> {
    const user = this.userRepository.create({
      ...data,
      habits: []
    });
    return await this.userRepository.save(user);
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
