/* eslint-disable @typescript-eslint/no-unused-vars */
import { IsAlpha, IsEmail, Length } from 'class-validator';
import { ObjectType, Field, ID } from 'type-graphql';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { IsUsername } from '../validators/isUsername';
import { Habit } from './habit';

@Entity()
@ObjectType()
export class User {
  @Field((type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Field()
  @Column({ unique: true })
  @Length(3, 32)
  @IsUsername()
  username: string;

  @Column()
  @Length(8, 64)
  password: string;

  @Field()
  @Column()
  @Length(1, 32)
  @IsAlpha()
  firstname: string;

  @Field()
  @Column()
  @Length(1, 32)
  @IsAlpha()
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
