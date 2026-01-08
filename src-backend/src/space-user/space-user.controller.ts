import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { SpaceUserService } from './space-user.service';
import { QuerySpaceUserDto } from './dto/query-space-user.dto';

@Controller('space-user')
export class SpaceUserController {
  constructor(private readonly spaceUserService: SpaceUserService) {}

  @Get('list')
  async list(@Query() query: QuerySpaceUserDto) {
    return this.spaceUserService.findSpaceUsers(query);
  }

  @Post('add')
  async add(
    @Body() body: { sid: string; uids: number[]; permission?: string },
  ) {
    return this.spaceUserService.addSpaceUsers(
      body.sid,
      body.uids,
      body.permission as any,
    );
  }

  @Get('ids')
  async getIds(@Query('sid') sid: string) {
    return this.spaceUserService.findAllSpaceUserIds(sid);
  }
}
