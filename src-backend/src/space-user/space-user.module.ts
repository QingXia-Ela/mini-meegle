import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SpaceUser } from './space-user.model';
import { SpaceUserService } from './space-user.service';
import { SpaceUserController } from './space-user.controller';

@Module({
  imports: [SequelizeModule.forFeature([SpaceUser])],
  providers: [SpaceUserService],
  controllers: [SpaceUserController],
  exports: [SequelizeModule, SpaceUserService],
})
export class SpaceUserModule {}

