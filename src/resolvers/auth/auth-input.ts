/* eslint-disable @typescript-eslint/no-unused-vars */

import { IsAlpha, IsEmail, Length } from 'class-validator';
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
  @Length(1, 32)
  @IsAlpha()
  firstname: string;

  @Field()
  @Length(1, 32)
  @IsAlpha()
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
