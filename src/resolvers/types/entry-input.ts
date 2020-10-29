/* eslint-disable @typescript-eslint/no-unused-vars */

import { Field, ID, InputType } from 'type-graphql';
import { Entry } from '../../entities/entry';

@InputType()
export class AddEntryInput implements Partial<Entry> {
  @Field((type) => ID)
  habitId: number;

  @Field((type) => Date)
  entryDate: Date;
}
