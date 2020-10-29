import 'reflect-metadata';
import dotenv from 'dotenv';

import { startConnection } from './database';
import { createServer } from './server';

dotenv.config();

const port = process.env.PORT || 4000;

(async () => {
  await startConnection();
  const server = await createServer();

  server.listen(port, () => console.log(`GraphQL Server is listening on port ${port}!`));
})();
