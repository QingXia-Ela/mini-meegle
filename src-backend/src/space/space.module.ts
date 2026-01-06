import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Space } from './space.model';
import { SpaceService } from './space.service';
import { SpaceController } from './space.controller';
import { SpaceUserModule } from '../space-user/space-user.module';

@Module({
  imports: [SequelizeModule.forFeature([Space]), SpaceUserModule],
  providers: [SpaceService],
  controllers: [SpaceController],
  exports: [SpaceService],
})
export class SpaceModule {}
