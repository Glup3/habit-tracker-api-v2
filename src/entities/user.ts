/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectType, Field, ID } from 'type-graphql';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Habit } from './habit';

@Entity()
@ObjectType()
export class User {
  @Field((type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  email: string;

  @Field()
  @Column()
  username: string;

  @Field()
  @Column()
  password: string;

  @Field()
  @Column()
  firstname: string;

  @Field()
  @Column()
  lastname: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Column('int', { default: 0 })
  tokenCount: number;

  @Field((type) => [Habit])
  @OneToMany((type) => Habit, (habit) => habit.user, { onDelete: 'CASCADE' })
  habits: Habit[];
}
