-- Settings 配置表：key-value 存储，value 为 JSON 字符串，整组整存整取
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
