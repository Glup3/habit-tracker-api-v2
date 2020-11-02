import { Field, ObjectType } from 'type-graphql';
import { Habit } from '../../entities/habit';

@ObjectType()
export class AddHabitPayload {
  @Field()
  habit: Habit;
}

@ObjectType()
export class RemoveHabitPayload {
  @Field()
  habit: Habit;
}
