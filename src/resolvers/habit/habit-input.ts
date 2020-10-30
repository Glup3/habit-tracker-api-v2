/* eslint-disable @typescript-eslint/no-unused-vars */

import { Field, ID, InputType } from 'type-graphql';
import { Habit } from '../../entities/habit';

@InputType()
export class AddHabitInput implements Partial<Habit> {
  @Field((type) => ID)
  userId: number;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field((type) => Date)
  startDate: Date;
}
