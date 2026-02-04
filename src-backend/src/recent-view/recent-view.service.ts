import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RecentView, RecentViewType } from './recent-view.model';
import { CreateRecentViewDto } from './dto/create-recent-view.dto';

@Injectable()
export class RecentViewService {
  constructor(
    @InjectModel(RecentView) private recentViewModel: typeof RecentView,
  ) {}

  async record(uid: number, dto: CreateRecentViewDto) {
    const type = dto.type;
    if (type !== RecentViewType.TASK) {
      throw new BadRequestException('Invalid recent view type');
    }

    const id = Number(dto.id);
    if (!Number.isFinite(id)) {
      throw new BadRequestException('Invalid target id');
    }

    const item = { type, id };
    const existing = await this.recentViewModel.findByPk(uid);
    if (!existing) {
      return this.recentViewModel.create({
        uid,
        recentView: [item],
      } as any);
    }

    const current = existing.recentView || [];
    const next = [
      item,
      ...current.filter((view) => !(view.type === type && view.id === id)),
    ].slice(0, 40);

    existing.recentView = next;
    return existing.save();
  }
}
