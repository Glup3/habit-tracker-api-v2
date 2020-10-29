/* eslint-disable @typescript-eslint/no-unused-vars */

import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Habit } from './habit';

@Entity()
@ObjectType()
export class Entry {
  @Field((type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  entryDate: Date;

  @Field((type) => Habit)
  @ManyToOne((type) => Habit, (habit) => habit.entries)
  habit: Habit;
}
