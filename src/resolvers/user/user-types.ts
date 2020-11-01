import { Field, ObjectType } from 'type-graphql';
import { User } from '../../entities/user';

@ObjectType()
export class DeleteMyAccountPayload {
  @Field()
  user: User;
}
