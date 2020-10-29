import { buildSchema } from 'type-graphql';
import { ApolloServer } from 'apollo-server';
import { Container } from 'typedi';

import { UserResolver } from './resolvers/user-resolver';
import { HabitResolver } from './resolvers/habit-resolver';
import { EntryResolver } from './resolvers/entry-resolver';

export const createServer = async (): Promise<ApolloServer> => {
  const schema = await buildSchema({
    resolvers: [UserResolver, HabitResolver, EntryResolver],
    container: Container,
    validate: false
  });

  return new ApolloServer({
    schema
  });
};
