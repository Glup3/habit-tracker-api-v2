import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';

import { UserResolver } from '../resolvers/user/user-resolver';
import { HabitResolver } from '../resolvers/habit/habit-resolver';
import { EntryResolver } from '../resolvers/entry/entry-resolver';
import { AuthResolver } from '../resolvers/auth/auth-resolver';
import { GraphQLSchema } from 'graphql';

export const createSchema = (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [UserResolver, HabitResolver, EntryResolver, AuthResolver],
    container: Container
  });
};
