import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'example_users', timestamps: true })
export class ExampleUser extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  uid: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email: string;
}
