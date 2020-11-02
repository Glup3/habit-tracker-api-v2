import { MaxLength } from 'class-validator';
import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Entry } from './entry';
import { User } from './user';

@Entity()
@ObjectType()
export class Habit {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  @MaxLength(64)
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @MaxLength(255)
  description?: string;

  @Field()
  @Column()
  startDate: Date;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.habits)
  user: User;

  @Field(() => [Entry])
  @OneToMany(() => Entry, (entry) => entry.habit, { onDelete: 'CASCADE' })
  entries: Entry[];
}
