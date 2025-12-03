import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExampleUser } from './example-user.model';
import { CreateExampleUserDto } from './dto/create-example-user.dto';
import { UpdateExampleUserDto } from './dto/update-example-user.dto';

@Injectable()
export class ExampleUserService {
  constructor(
    @InjectModel(ExampleUser)
    private exampleUserModel: typeof ExampleUser,
  ) {}

  async create(dto: CreateExampleUserDto): Promise<ExampleUser> {
    return this.exampleUserModel.create(dto as any);
  }

  async findAll(): Promise<ExampleUser[]> {
    return this.exampleUserModel.findAll();
  }

  async findOne(id: number): Promise<ExampleUser> {
    const user = await this.exampleUserModel.findByPk(id);
    if (!user) throw new NotFoundException('ExampleUser not found');
    return user;
  }

  async update(id: number, dto: UpdateExampleUserDto): Promise<ExampleUser> {
    const user = await this.findOne(id);
    return user.update(dto);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
