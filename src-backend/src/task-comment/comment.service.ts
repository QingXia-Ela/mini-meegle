import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Comment } from './comment.model';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { User } from '../user/user.model';

@Injectable()
export class CommentService {
  constructor(@InjectModel(Comment) private commentModel: typeof Comment) {}

  async create(dto: CreateCommentDto, userId: number): Promise<Comment> {
    return this.commentModel.create({ ...dto, uid: userId } as any);
  }

  async findAllByTask(tid: number): Promise<Comment[]> {
    return this.commentModel.findAll({
      where: { tid },
      include: [
        { model: User, attributes: ['id', 'name', 'avatar'] },
        {
          model: Comment,
          as: 'parentComment',
          include: [{ model: User, attributes: ['id', 'name'] }],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentModel.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'name', 'avatar'] },
        {
          model: Comment,
          as: 'parentComment',
          include: [{ model: User, attributes: ['id', 'name'] }],
        },
      ],
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async update(
    id: number,
    dto: UpdateCommentDto,
    userId: number,
  ): Promise<Comment> {
    const comment = await this.findOne(id);
    if (comment.uid !== userId) {
      throw new ForbiddenException('No permission to update this comment');
    }
    return comment.update(dto as any);
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.findOne(id);
    if (comment.uid !== userId) {
      throw new ForbiddenException('No permission to delete this comment');
    }
    await comment.destroy();
  }
}
