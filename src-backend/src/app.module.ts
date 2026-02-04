import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import 'dotenv/config';
import { ExampleUserModule } from './example-user/example-user.module';
import { AuthModule } from './auth/auth.module';
import { SpaceModule } from './space/space.module';
import { SpaceUserModule } from './space-user/space-user.module';
import { WorkItemModule } from './work-item/work-item.module';
import { WorkItemRoleModule } from './work-item-role/work-item-role.module';
import { WorkItemFieldModule } from './work-item-field/work-item-field.module';
import { TaskModule } from './task/task.module';
import { TaskNodeStatusModule } from './task-nodestatus/task-nodestatus.module';
import { WorkflowTypeModule } from './workflow-type/workflow-type.module';
import { CommentModule } from './task-comment/comment.module';
import { NoticeModule } from './notice/notice.module';
import { FavoritesModule } from './favorites/favorites.module';
import { UploadModule } from './upload/upload.module';
import { RecentViewModule } from './recent-view/recent-view.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ResponseInterceptor } from './common/response.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';

const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USERNAME,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} = process.env;

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: MYSQL_HOST,
      port: Number(MYSQL_PORT),
      username: MYSQL_USERNAME,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      autoLoadModels: true,
      synchronize: true,
      sync: {
        alter: false,
        force: false,
      },
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
      dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }),
    ExampleUserModule,
    AuthModule,
    SpaceModule,
    SpaceUserModule,
    WorkItemModule,
    WorkItemRoleModule,
    WorkItemFieldModule,
    TaskModule,
    TaskNodeStatusModule,
    WorkflowTypeModule,
    CommentModule,
    NoticeModule,
    FavoritesModule,
    RecentViewModule,
    UploadModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    AppService,
  ],
})
export class AppModule {}
