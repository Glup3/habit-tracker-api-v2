import { Field, ObjectType } from 'type-graphql';
import { User } from '../../entities/user';

@ObjectType()
export class DeleteMyAccountPayload {
  @Field()
  user: User;
}

@ObjectType()
export class UpdatePasswordPayload {
  @Field()
  success: boolean;
}

@ObjectType()
export class UpdateEmailPayload {
  @Field()
  success: boolean;
}

@ObjectType()
export class UpdateUsernamePayload {
  @Field()
  success: boolean;
}

@ObjectType()
export class UpdateMePayload {
  @Field()
  user: User;
}
