import { Connection, createConnection, useContainer } from 'typeorm';
import dotenv from 'dotenv';
import Container from 'typedi';

dotenv.config();
useContainer(Container);

export const testConnection = (drop = false): Promise<Connection> => {
  return createConnection({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(<string>process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    schema: process.env.DB_TEST_SCHEMA,
    logging: false,
    synchronize: drop,
    dropSchema: drop,
    entities: [__dirname + '/../entities/*.ts']
  });
};
