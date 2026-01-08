import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { SpaceService } from './space.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Controller('spaces')
export class SpaceController {
  constructor(private readonly service: SpaceService) {}

  @Post('create')
  create(@Body() dto: CreateSpaceDto, @Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    return this.service.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('my')
  findMySpaces(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    return this.service.findByUserId(userId);
  }

  @Post('join')
  join(@Body() dto: { spaceId: string }, @Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    return this.service.join(dto.spaceId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSpaceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
