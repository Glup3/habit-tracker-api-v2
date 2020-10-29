/* eslint-disable @typescript-eslint/no-unused-vars */

import { Field, InputType } from 'type-graphql';
import { User } from '../../entities/user';

@InputType()
export class AddUserInput implements Partial<User> {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  username: string;

  @Field()
  firstname: string;

  @Field()
  lastname: string;
}
