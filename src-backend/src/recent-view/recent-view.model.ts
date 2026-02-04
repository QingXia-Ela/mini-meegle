import { Table, Column, Model, DataType } from 'sequelize-typescript';

export enum RecentViewType {
  TASK = 'task',
}

export interface RecentViewItem {
  type: RecentViewType;
  id: number;
}

@Table({ tableName: 'recentViews', timestamps: true })
export class RecentView extends Model {
  @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true })
  declare uid: number;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  recentViewRaw?: string;

  @Column({ type: DataType.VIRTUAL, allowNull: true })
  get recentView(): RecentViewItem[] {
    const raw = this.getDataValue('recentViewRaw') as string | undefined;
    if (!raw) return [];
    try {
      const list = JSON.parse(raw) as RecentViewItem[];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  set recentView(value: RecentViewItem[]) {
    const safeValue = (value || []).filter(
      (item) => item?.type === RecentViewType.TASK && item?.id !== undefined,
    );
    this.setDataValue('recentViewRaw', JSON.stringify(safeValue));
  }
}
