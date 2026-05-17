/**
 * Settings 注册表
 *
 * 用于定义服务端重要配置组（如：是否允许新用户注册、定期清理邮件等）。
 * 前端本地偏好（分页大小、主题等）请用 localStorage，勿注册在此。
 *
 * 每个配置组：
 * - key: D1 中的主键
 * - defaultValue: 类型安全的默认值（接口定义字段类型）
 * - description: 可读描述
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

/** 邮箱域名配置：系统接受的域名列表 */
export interface DomainSettings {
  domains: string[];
}

// ========== 注册表 ==========

export const SETTINGS = {
  domains: {
    key: 'domains',
    defaultValue: { domains: [] } as DomainSettings,
    description: '邮箱域名配置（收件时校验域名合法性）',
  },
} as const;

export type SettingsGroupName = keyof typeof SETTINGS;
