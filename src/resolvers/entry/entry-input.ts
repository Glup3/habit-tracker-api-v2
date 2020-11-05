import { IsPositive, Max, Min } from 'class-validator';
import { Field, ID, InputType, Int } from 'type-graphql';
import { Entry } from '../../entities/entry';

@InputType()
export class ToggleEntryInput implements Partial<Entry> {
  @Field(() => ID)
  habitId: number;

  @Field(() => Int)
  @IsPositive()
  year: number;

  @Field(() => Int)
  @Min(0)
  @Max(12)
  month: number;

  @Field(() => Int)
  @Min(0)
  @Max(31)
  day: number;
}
