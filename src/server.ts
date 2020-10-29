import { buildSchema } from 'type-graphql';
import { ApolloServer } from 'apollo-server-express';
import { Container } from 'typedi';
import cookieParser from 'cookie-parser';
import jwt from 'express-jwt';
import bodyParser from 'body-parser';
import express from 'express';

import { UserResolver } from './resolvers/user-resolver';
import { HabitResolver } from './resolvers/habit-resolver';
import { EntryResolver } from './resolvers/entry-resolver';
import { authMiddleware } from './middlewares/auth-middleware';
import { AuthResolver } from './resolvers/auth-resolver';

export const createServer = async (): Promise<express.Express> => {
  const server = express();

  const schema = await buildSchema({
    resolvers: [UserResolver, HabitResolver, EntryResolver, AuthResolver],
    container: Container,
    validate: false
  });

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res })
  });

  const auth = jwt({
    secret: <string>process.env.JWT_SECRET,
    credentialsRequired: false,
    algorithms: ['HS256']
  });

  server.use(cookieParser());

  server.use(authMiddleware);

  server.use(bodyParser.json(), auth);
  apolloServer.applyMiddleware({ app: server });

  return server;
};
