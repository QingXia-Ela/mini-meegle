import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TaskController {
  constructor(private readonly service: TaskService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.service.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('workItem/:workItemId')
  findByWorkItemId(
    @Param('workItemId') workItemId: string,
    @Query('count') count: string,
    @Query('offset') offset: string,
  ) {
    return this.service.findByWorkItemId(
      workItemId,
      count ? Number(count) : 10,
      offset ? Number(offset) : 0,
    );
  }

  @Get('workItem/:workItemId/stats')
  getStats(@Param('workItemId') workItemId: string, @Req() req: any) {
    const userId = req.user?.sub;
    return this.service.getStats(workItemId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
