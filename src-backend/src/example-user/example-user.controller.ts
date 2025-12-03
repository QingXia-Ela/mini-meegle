import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ExampleUserService } from './example-user.service';
import { CreateExampleUserDto } from './dto/create-example-user.dto';
import { UpdateExampleUserDto } from './dto/update-example-user.dto';

@Controller('example-users')
export class ExampleUserController {
  constructor(private readonly service: ExampleUserService) {}

  @Post()
  create(@Body() dto: CreateExampleUserDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExampleUserDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
