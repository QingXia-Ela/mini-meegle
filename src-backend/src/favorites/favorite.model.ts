import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'favorites', timestamps: true })
export class Favorite extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare type: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare tid: number;
}
