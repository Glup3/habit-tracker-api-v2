import { IsEmail, Length } from 'class-validator';
import { Field, InputType } from 'type-graphql';
import { User } from '../../entities/user';

@InputType()
export class UpdatePasswordInput implements Partial<User> {
  @Field()
  @Length(8, 64)
  password: string;
}

@InputType()
export class UpdateEmailInput implements Partial<User> {
  @Field()
  @IsEmail()
  email: string;
}
