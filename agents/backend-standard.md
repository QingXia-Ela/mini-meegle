# 后端开发规范

## 1. 技术栈概览
- **框架**: NestJS
- **ORM**: Sequelize (sequelize-typescript)
- **认证**: JWT (jsonwebtoken)
- **数据库**: MySQL

## 2. 统一响应格式
所有 API 响应必须遵循以下结构（由 `ResponseInterceptor` 和 `HttpExceptionFilter` 统一处理）：

```ts
interface ApiResponse<T> {
  code: number; // 业务/状态码
  msg: string;  // 提示消息
  data: T;      // 数据载体 (错误时为 null)
}
```

## 3. 错误码使用规范
项目不定义冗余的业务代码，直接映射 **HTTP 状态码** 到 `code` 字段。

## 4. 获取上下文数据 (用户信息)

所有受 `JwtAuthGuard` 保护的路由（非 `@Public()` 装饰的路由）均可在请求上下文中获取用户信息。

### 用户信息对象结构
用户信息被注入到 `Request` 对象的 `user` 属性中，其结构定义如下：

```ts
interface CurrentUser {
  sub: string;   // 用户唯一 ID
  name: string;  // 用户名
  email: string; // 邮箱地址
}
```

### 获取当前用户示例
在 Controller 中直接解构或使用 `@Request` 装饰器：

```ts
import { Controller, Get, Request } from '@nestjs/common';

@Controller('example')
export class ExampleController {
  @Get('info')
  async getMyInfo(@Request() req) {
    const user = req.user; // 获取用户信息
    const userId = user.sub; // 获取用户 ID
    // ...
  }
}
```

## 5. 开发建议
- **DTO**: 必须为每个接口定义 DTO，并使用 `class-validator` 校验。
- **业务逻辑**: 保持 Controller 简洁，核心逻辑下沉到 Service 层。
- **关联查询**: 优先使用 Sequelize 的 `include` 配置处理关联，避免多次循环查询。
- **事务**: 涉及多表写操作时，务必使用 `Sequelize` 事务。
- **JSON内容存储**: 使用 LONGTEXT 存储，且字段名必须为 `XXXRaw`，在 nest 层则需要将 Raw 反序列化并创建对应的 `XXX` 虚拟列。