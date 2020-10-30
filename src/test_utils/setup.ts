import { testConnection } from './test-database';

testConnection(true).then(() => process.exit());
