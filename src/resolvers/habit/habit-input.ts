import { MaxLength } from 'class-validator';
import { Field, ID, InputType } from 'type-graphql';
import { Habit } from '../../entities/habit';

@InputType()
export class AddHabitInput implements Partial<Habit> {
  @Field()
  @MaxLength(64)
  title: string;

  @Field({ nullable: true })
  @MaxLength(255)
  description?: string;

  @Field(() => Date)
  startDate: Date;
}

@InputType()
export class RemoveHabitInput implements Partial<Habit> {
  @Field(() => ID)
  id: number;
}

@InputType()
export class HabitInput implements Partial<Habit> {
  @Field(() => ID)
  id: number;
}
