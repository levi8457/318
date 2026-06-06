import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
} from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ name: 'company', length: 200, nullable: true })
  company: string;

  @Column({ name: 'team_size', length: 20, nullable: true })
  teamSize: string;

  @Column({ default: 'new', length: 20 })
  status: 'new' | 'contacted' | 'converted' | 'rejected';

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
