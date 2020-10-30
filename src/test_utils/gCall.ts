import { ExecutionResult, graphql, GraphQLSchema } from 'graphql';
import { Maybe } from 'graphql/jsutils/Maybe';
import { createSchema } from '../utils/createSchema';

interface Options {
  source: string;
  variableValues?: Maybe<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }>;
  username?: string;
}

let schema: GraphQLSchema;

export const gCall = async ({ source, variableValues, username }: Options): Promise<ExecutionResult> => {
  if (!schema) {
    schema = await createSchema();
  }
  return graphql({
    schema,
    source,
    variableValues,
    contextValue: {
      req: {
        username
      },
      res: {
        cookie: jest.fn()
      }
    }
  });
};
