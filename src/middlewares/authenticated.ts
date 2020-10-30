import { MiddlewareInterface, NextFn, ResolverData } from 'type-graphql';
import { Service } from 'typedi';
import { Context } from '../types/context.interface';

@Service()
export class Authenticated implements MiddlewareInterface<Context> {
  async use({ context }: ResolverData<Context>, next: NextFn): Promise<NextFn> {
    if (!context.req.username) {
      throw new Error('User is not logged in');
    }

    return next();
  }
}
