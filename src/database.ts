import { createConnection, useContainer } from 'typeorm';
import { Container } from 'typedi';

useContainer(Container);

export const startConnection = async (): Promise<void> => {
  await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(<string>process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    schema: process.env.DB_SCHEMA,
    logging: false,
    synchronize: true,
    entities: ['src/entities/*.ts']
  }).then(() => {
    console.log('Database Connection successfully established');
  });
};
