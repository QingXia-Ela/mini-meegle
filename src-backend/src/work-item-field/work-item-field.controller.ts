import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { WorkItemFieldService } from './work-item-field.service';
import { CreateWorkItemFieldDto } from './dto/create-work-item-field.dto';
import { UpdateWorkItemFieldDto } from './dto/update-work-item-field.dto';

@Controller('workItems')
export class WorkItemFieldController {
  constructor(private readonly service: WorkItemFieldService) {}

  @Get(':id/fields')
  findFields(@Param('id') id: string) {
    return this.service.findByWorkItemId(id);
  }

  @Post(':id/field')
  createField(@Param('id') id: string, @Body() dto: CreateWorkItemFieldDto) {
    return this.service.create(id, dto);
  }

  @Get(':id/field/:fieldId')
  findOne(@Param('id') id: string, @Param('fieldId') fieldId: string) {
    return this.service.findOne(id, fieldId);
  }

  @Put(':id/field/:fieldId')
  updateField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateWorkItemFieldDto,
  ) {
    return this.service.update(id, fieldId, dto);
  }

  @Delete(':id/field/:fieldId')
  removeField(@Param('id') id: string, @Param('fieldId') fieldId: string) {
    return this.service.remove(id, fieldId);
  }
}
