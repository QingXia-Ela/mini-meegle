import { Body, Controller, Post, Req, BadRequestException } from '@nestjs/common';
import { RecentViewService } from './recent-view.service';
import { CreateRecentViewDto } from './dto/create-recent-view.dto';

@Controller('recent-views')
export class RecentViewController {
  constructor(private readonly service: RecentViewService) {}

  @Post()
  record(@Body() dto: CreateRecentViewDto, @Req() req: any) {
    const uid = req.user?.sub;
    if (!uid) {
      throw new BadRequestException('Missing user id');
    }
    return this.service.record(Number(uid), dto);
  }
}
