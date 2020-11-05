import { Field, ObjectType, registerEnumType } from 'type-graphql';
import { Entry } from '../../entities/entry';

@ObjectType()
export class ToggleEntryPayload {
  @Field()
  entry: Entry;

  @Field(() => ToggleState)
  toggleState: ToggleState;
}

export enum ToggleState {
  ADDED = 'ADDED',
  REMOVED = 'REMOVED'
}

registerEnumType(ToggleState, {
  name: 'ToggleState',
  description: 'All possible toggle states'
});
