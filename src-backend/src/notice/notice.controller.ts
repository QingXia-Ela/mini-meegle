import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Req,
  Query,
} from '@nestjs/common';
import { NoticeService } from './notice.service';

interface AuthRequest {
  user: {
    sub?: number;
    id?: number;
  };
}

@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Get()
  async getMyNotices(
    @Req() req: AuthRequest,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.sub ?? req.user.id;
    if (!userId) {
      return { items: [], total: 0, offset: 0, limit: 0, hasMore: false };
    }
    return this.noticeService.findAllByUser(
      userId,
      offset ? Number(offset) : 0,
      limit ? Number(limit) : 20,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthRequest) {
    const userId = req.user.sub ?? req.user.id;
    const count = userId ? await this.noticeService.getUnreadCount(userId) : 0;
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user.sub ?? req.user.id;
    if (userId) {
      await this.noticeService.markAsRead(id, userId);
    }
    return { success: true };
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: AuthRequest) {
    const userId = req.user.sub ?? req.user.id;
    if (userId) {
      await this.noticeService.markAllAsRead(userId);
    }
    return { success: true };
  }
}
