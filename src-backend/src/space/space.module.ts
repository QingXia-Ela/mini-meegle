import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Space } from './space.model';
import { SpaceUser } from './space-user.model';
import { SpaceService } from './space.service';
import { SpaceController } from './space.controller';

@Module({
  imports: [SequelizeModule.forFeature([Space, SpaceUser])],
  providers: [SpaceService],
  controllers: [SpaceController],
  exports: [SpaceService],
})
export class SpaceModule {}
