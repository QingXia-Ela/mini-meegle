import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { WorkflowTypeService } from './workflow-type.service';
import { CreateWorkflowTypeDto } from './dto/create-workflow-type.dto';
import { UpdateWorkflowTypeDto } from './dto/update-workflow-type.dto';

@Controller('workflow-types')
export class WorkflowTypeController {
  constructor(private readonly service: WorkflowTypeService) {}

  @Post()
  create(@Body() dto: CreateWorkflowTypeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('workItem/:wid')
  findByWorkItemId(@Param('wid') wid: string) {
    return this.service.findByWorkItemId(wid);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowTypeDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
