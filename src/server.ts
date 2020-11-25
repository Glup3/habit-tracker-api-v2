import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import jwt from 'express-jwt';
import bodyParser from 'body-parser';
import express from 'express';

import { authMiddleware } from './middlewares/auth-middleware';
import { createSchema } from './utils/createSchema';

export const createServer = async (): Promise<express.Express> => {
  const server = express();
  const schema = await createSchema();

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res })
  });

  const auth = jwt({
    secret: <string>process.env.JWT_SECRET,
    credentialsRequired: false,
    algorithms: ['HS256']
  });

  const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
    credentials: true
  };

  server.use(cookieParser());
  server.use(authMiddleware);
  server.use(bodyParser.json(), auth);

  apolloServer.applyMiddleware({ app: server, cors: corsOptions });

  return server;
};
