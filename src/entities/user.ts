/* eslint-disable @typescript-eslint/no-unused-vars */
import { IsEmail, Length, MaxLength } from 'class-validator';
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
  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Field()
  @Column({ unique: true })
  @Length(3, 32)
  username: string;

  @Column()
  @Length(8, 64)
  password: string;

  @Field()
  @Column()
  @MaxLength(32)
  firstname: string;

  @Field()
  @Column()
  @MaxLength(32)
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
