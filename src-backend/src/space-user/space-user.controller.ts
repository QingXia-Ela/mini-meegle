import { Controller, Get, Query } from '@nestjs/common';
import { SpaceUserService } from './space-user.service';
import { QuerySpaceUserDto } from './dto/query-space-user.dto';

@Controller('space-user')
export class SpaceUserController {
  constructor(private readonly spaceUserService: SpaceUserService) {}

  @Get('list')
  async list(@Query() query: QuerySpaceUserDto) {
    return this.spaceUserService.findSpaceUsers(query);
  }
}
