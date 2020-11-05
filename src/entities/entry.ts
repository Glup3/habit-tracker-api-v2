import { IsPositive, Max, Min } from 'class-validator';
import { Field, ID, Int, ObjectType } from 'type-graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Habit } from './habit';

@Entity()
@ObjectType()
export class Entry {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column()
  @IsPositive()
  year: number;

  @Field(() => Int)
  @Column()
  @Min(0)
  @Max(12)
  month: number;

  @Field(() => Int)
  @Column()
  @Min(0)
  @Max(31)
  day: number;

  @Field(() => Habit)
  @ManyToOne(() => Habit, (habit) => habit.entries)
  habit: Habit;
}
