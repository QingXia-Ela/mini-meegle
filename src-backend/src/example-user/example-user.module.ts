import { SequelizeModule } from '@nestjs/sequelize';
import { ExampleUser } from './example-user.model';
import { Module } from '@nestjs/common';
import { ExampleUserService } from './example-user.service';
import { ExampleUserController } from './example-user.controller';

@Module({
  imports: [SequelizeModule.forFeature([ExampleUser])],
  providers: [ExampleUserService],
  controllers: [ExampleUserController],
})
export class ExampleUserModule {}
