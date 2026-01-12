import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Comment } from './comment.model';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

@Module({
  imports: [SequelizeModule.forFeature([Comment])],
  providers: [CommentService],
  controllers: [CommentController],
  exports: [SequelizeModule, CommentService],
})
export class CommentModule {}
