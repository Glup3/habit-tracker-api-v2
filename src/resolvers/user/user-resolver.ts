import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { User } from '../../entities/user';

@Resolver(User)
export class UserResolver {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  @Query(() => [User])
  users(): Promise<User[]> {
    return this.userRepository.find({ relations: ['habits'] });
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
