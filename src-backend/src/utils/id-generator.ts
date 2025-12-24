/**
 * 生成随机ID，包含大小写字母和数字
 * @param length ID长度
 */
function generateRandomId(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成8位随机ID，包含大小写字母和数字
 */
export function generateId(): string {
  return generateRandomId(8);
}

/**
 * 生成6位随机ID，包含大小写字母和数字
 */
export function generateShortId(): string {
  return generateRandomId(6);
}

/**
 * 生成唯一ID，会检查数据库中是否已存在
 * @param model Sequelize模型类
 * @param length ID长度
 * @param maxRetries 最大重试次数
 */
export async function generateUniqueId<
  T extends { findByPk: (id: string) => Promise<T | null> },
>(model: T, length: number = 8, maxRetries: number = 10): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const id = generateRandomId(length);
    const existing = await model.findByPk(id);
    if (!existing) {
      return id;
    }
  }
  throw new Error(`无法生成唯一ID，已重试${maxRetries}次`);
}
