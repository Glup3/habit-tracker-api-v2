import { Field, ObjectType } from 'type-graphql';
import { User } from '../../entities/user';

@ObjectType()
export class RegisterPayload {
  @Field()
  user: User;
}

@ObjectType()
export class LoginPayload {
  @Field()
  user: User;
}
