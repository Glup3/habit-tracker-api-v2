/* eslint-disable @typescript-eslint/no-unused-vars */

import { IsEmail, Length, MaxLength } from 'class-validator';
import { Field, InputType } from 'type-graphql';
import { User } from '../../entities/user';
import { IsUsername } from '../../validators/isUsername';

@InputType()
export class RegisterInput implements Partial<User> {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(8, 64)
  password: string;

  @Field()
  @Length(3, 32)
  @IsUsername()
  username: string;

  @Field()
  @MaxLength(32)
  firstname: string;

  @Field()
  @MaxLength(32)
  lastname: string;
}

@InputType()
export class LoginInput implements Partial<User> {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(8, 64)
  password: string;
}
