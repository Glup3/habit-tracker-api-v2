/* eslint-disable @typescript-eslint/no-unused-vars */

import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Entry } from './entry';
import { User } from './user';

@Entity()
@ObjectType()
export class Habit {
  @Field((type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  description: string;

  @Field()
  @Column()
  startDate: Date;

  @Field((type) => User)
  @ManyToOne((type) => User, (user) => user.habits)
  user: User;

  @Field((type) => [Entry])
  @OneToMany((type) => Entry, (entry) => entry.habit, { onDelete: 'CASCADE' })
  entries: Entry[];
}