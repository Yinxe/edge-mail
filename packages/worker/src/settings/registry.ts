/**
 * Settings 注册表
 *
 * 每个配置组：
 * - key: D1 中的主键
 * - defaultValue: 类型安全的默认值（接口定义字段类型）
 * - description: 可读描述
 *
 * 使用方式：
 *   const emailCfg = await getSettings(db, 'email');
 *   // emailCfg.pageSize: number, emailCfg.showPreview: boolean
 *
 * 加新配置组只需三步：
 *   1. 定义接口（如 XxxSettings）
 *   2. 在 SETTINGS 中注册一行
 *   3. 使用 getSettings/setSettings 读写
 */

export interface SettingDefinition<T extends Record<string, unknown>> {
  key: string;
  defaultValue: T;
  description?: string;
}

// ========== 设置组类型定义 ==========

export interface EmailSettings {
  pageSize: number;
  showPreview: boolean;
}

// ========== 注册表 ==========

export const SETTINGS = {
  email: {
    key: 'email',
    defaultValue: { pageSize: 20, showPreview: true } as EmailSettings,
    description: '邮件相关设置（每页数量、预览开关）',
  },
} as const;

export type SettingsGroupName = keyof typeof SETTINGS;
