import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Req,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly service: CommentService) {}

  @Post()
  create(@Body() dto: CreateCommentDto, @Req() req: any) {
    const userId = req.user.sub;
    return this.service.create(dto, userId);
  }

  @Get('task/:tid')
  findAllByTask(@Param('tid') tid: string) {
    return this.service.findAllByTask(Number(tid));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.service.update(Number(id), dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.service.remove(Number(id), userId);
  }
}
