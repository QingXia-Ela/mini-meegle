import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TaskNodeStatusService } from './task-nodestatus.service';
import { CreateSubTaskDto } from './dto/create-sub-task.dto';
import { UpdateSubTaskDto } from './dto/update-sub-task.dto';
import { UpdateNodeStatusDto } from './dto/update-node-status.dto';
import { TransitionNodeStatusDto } from './dto/transition-node-status.dto';

@Controller('task-node-status')
export class TaskNodeStatusController {
  constructor(private readonly service: TaskNodeStatusService) {}

  @Get(':taskId/nodes')
  listNodeStatuses(@Param('taskId') taskId: string) {
    return this.service.listNodeStatuses(Number(taskId));
  }

  @Get(':taskId/nodes/:nodeId')
  getNodeStatus(
    @Param('taskId') taskId: string,
    @Param('nodeId') nodeId: string,
  ) {
    return this.service.getNodeStatus(Number(taskId), nodeId);
  }

  @Put(':taskId/nodes/:nodeId')
  updateNodeStatus(
    @Param('taskId') taskId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: UpdateNodeStatusDto,
  ) {
    return this.service.updateNodeStatus(Number(taskId), nodeId, dto);
  }

  @Post(':taskId/nodes/:nodeId/transition')
  transitionNodeStatus(
    @Param('taskId') taskId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: TransitionNodeStatusDto,
  ) {
    return this.service.transitionNodeStatus(Number(taskId), nodeId, dto);
  }

  @Get(':taskId/nodes/:nodeId/sub-tasks')
  listSubTasks(
    @Param('taskId') taskId: string,
    @Param('nodeId') nodeId: string,
  ) {
    return this.service.listSubTasks(Number(taskId), nodeId);
  }

  @Get(':taskId/nodes/:nodeId/sub-tasks/:name')
  getSubTask(
    @Param('taskId') taskId: string,
    @Param('nodeId') nodeId: string,
    @Param('name') name: string,
  ) {
    return this.service.getSubTask(Number(taskId), nodeId, name);
  }

  @Post(':taskId/nodes/:nodeId/sub-tasks')
  createSubTask(
    @Param('taskId') taskId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: CreateSubTaskDto,
  ) {
    return this.service.createSubTask(Number(taskId), nodeId, dto);
  }

  @Put(':taskId/nodes/:nodeId/sub-tasks/:name')
  updateSubTask(
    @Param('taskId') taskId: string,
    @Param('nodeId') nodeId: string,
    @Param('name') name: string,
    @Body() dto: UpdateSubTaskDto,
  ) {
    return this.service.updateSubTask(Number(taskId), nodeId, name, dto);
  }

  @Delete(':taskId/nodes/:nodeId/sub-tasks/:name')
  removeSubTask(
    @Param('taskId') taskId: string,
    @Param('nodeId') nodeId: string,
    @Param('name') name: string,
  ) {
    return this.service.removeSubTask(Number(taskId), nodeId, name);
  }
}
