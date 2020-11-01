import { IsAlpha, IsEmail, Length } from 'class-validator';
import { Field, InputType } from 'type-graphql';
import { User } from '../../entities/user';
import { IsUsername } from '../../validators/isUsername';

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

@InputType()
export class UpdateUsernameInput implements Partial<User> {
  @Field()
  @Length(3, 32)
  @IsUsername()
  username: string;
}

@InputType()
export class UpdateMeInput implements Partial<User> {
  @Field({ nullable: true })
  @Length(1, 32)
  @IsAlpha()
  firstname?: string;

  @Field({ nullable: true })
  @Length(1, 32)
  @IsAlpha()
  lastname?: string;
}
