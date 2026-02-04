import { Injectable } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: any): Promise<string> {
    await this.ensureUploadDir();

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = file.originalname.split('.').pop();
    const filename = `${timestamp}-${randomStr}.${ext}`;

    const filepath = join(this.uploadDir, filename);
    await writeFile(filepath, file.buffer);

    // 返回访问路径
    return `/uploads/${filename}`;
  }
}
