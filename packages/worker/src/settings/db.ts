import type { D1Database } from '@cloudflare/workers-types';
import { SETTINGS, type SettingsGroupName } from './registry';

/** 从 SETTINGS 推导每个 group 的返回值类型 */
type SettingsValue<K extends SettingsGroupName> =
  (typeof SETTINGS)[K]['defaultValue'];

/**
 * 读取一个设置组。
 *
 * 先从 D1 读 JSON 字符串，解析后与 defaultValue 合并（覆盖字段，缺失补默认）。
 * JSON 解析失败或 D1 查询异常时返回完整的 defaultValue（降级安全）。
 */
export async function getSettings<K extends SettingsGroupName>(
  db: D1Database,
  group: K,
): Promise<SettingsValue<K>> {
  const def = SETTINGS[group];

  try {
    const row = await db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .bind(def.key)
      .first<{ value: string }>();

    if (!row) return def.defaultValue;

    const parsed = JSON.parse(row.value);
    // 确保 parsed 是对象，避免 string/number 等意外类型覆盖
    if (typeof parsed !== 'object' || parsed === null) {
      return def.defaultValue;
    }

    // Spread 合并：DB 覆盖值中的字段替换默认值，缺失字段保留默认值
    return { ...def.defaultValue, ...parsed } as SettingsValue<K>;
  } catch {
    return def.defaultValue;
  }
}

/**
 * 写入一个设置组（部分更新）。
 *
 * 会先读取当前值，合并传入字段，再整体写回。
 * 确保不会因部分更新而丢失未传入的字段。
 */
export async function setSettings<K extends SettingsGroupName>(
  db: D1Database,
  group: K,
  value: Partial<SettingsValue<K>>,
): Promise<void> {
  const def = SETTINGS[group];

  const current = await getSettings(db, group);
  const merged = { ...current, ...value };
  const json = JSON.stringify(merged);

  await db
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    )
    .bind(def.key, json, json)
    .run();
}

type AllSettingsMap = {
  [K in SettingsGroupName]: SettingsValue<K>;
};

/**
 * 读取所有设置组，返回 { groupName: settings } 的映射。
 */
export async function getAllSettings(
  db: D1Database,
): Promise<AllSettingsMap> {
  const result = {} as AllSettingsMap;

  for (const name of Object.keys(SETTINGS) as SettingsGroupName[]) {
    result[name] = await getSettings(db, name);
  }

  return result;
}
