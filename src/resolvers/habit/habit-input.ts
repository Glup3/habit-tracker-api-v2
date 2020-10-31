/* eslint-disable @typescript-eslint/no-unused-vars */

import { Length, MaxLength } from 'class-validator';
import { Field, InputType } from 'type-graphql';
import { Habit } from '../../entities/habit';

@InputType()
export class AddHabitInput implements Partial<Habit> {
  @Field()
  @MaxLength(64)
  title: string;

  @Field()
  @Length(30, 255)
  description: string;

  @Field((type) => Date)
  startDate: Date;
}
