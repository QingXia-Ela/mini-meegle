import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { WorkItemRoleService } from './work-item-role.service';
import { CreateWorkItemRoleDto } from './dto/create-work-item-role.dto';
import { UpdateWorkItemRoleDto } from './dto/update-work-item-role.dto';

@Controller('workItems')
export class WorkItemRoleController {
  constructor(private readonly service: WorkItemRoleService) {}

  @Get(':id/roles')
  findRoles(@Param('id') id: string) {
    return this.service.findByWorkItemId(id);
  }

  @Post(':id/roles')
  createRole(@Param('id') id: string, @Body() dto: CreateWorkItemRoleDto) {
    return this.service.create(id, dto);
  }

  @Put('roles/:roleId')
  updateRole(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateWorkItemRoleDto,
  ) {
    return this.service.update(roleId, dto);
  }

  @Delete('roles/:roleId')
  removeRole(@Param('roleId') roleId: string) {
    return this.service.remove(roleId);
  }
}
