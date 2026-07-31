SET search_path TO voucher_returns;

-- 批次作業紀錄：每次「整理序號」或一個掃描 session 的批次
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('batch', 'scan')), -- [INTERNAL] 批次模式 or 即時歸組模式
  operator TEXT NOT NULL, -- [EXTERNAL] 來源系統：FME AasApi CheckUserId（登入帳號）
  tolerance INTEGER NOT NULL DEFAULT 20, -- [INTERNAL] 即時歸組模式使用的容忍值
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 序號群組：連號區間彙整結果
CREATE TABLE IF NOT EXISTS serial_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL, -- [COMPUTED] 公式：券種(type) + 批號(batchNo)
  from_seq INTEGER NOT NULL, -- [COMPUTED] 群組內最小流水號
  to_seq INTEGER NOT NULL,   -- [COMPUTED] 群組內最大流水號
  item_count INTEGER NOT NULL, -- [COMPUTED] 公式：to_seq - from_seq + 1（若無缺號）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 序號明細：每一張禮券序號
CREATE TABLE IF NOT EXISTS serial_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  group_id UUID REFERENCES serial_groups(id) ON DELETE SET NULL,
  raw_serial TEXT NOT NULL, -- [EXTERNAL] 來源系統：全家便利商店禮物卡條碼（實體卡片掃描/貼入）
  serial_type TEXT NOT NULL,   -- [COMPUTED] 公式：parseSerial() Group1，券種
  batch_no TEXT NOT NULL,      -- [COMPUTED] 公式：parseSerial() Group2，批號
  seq INTEGER NOT NULL,        -- [COMPUTED] 公式：parseSerial() Group3 轉整數，連號比對依據
  seq_str TEXT NOT NULL,       -- [COMPUTED] 公式：parseSerial() Group3 原始 7 碼字串
  checksum TEXT NOT NULL,      -- [COMPUTED] 公式：parseSerial() Group4，格式驗證用
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'error', 'duplicate')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_serial_items_batch ON serial_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_serial_items_group ON serial_items(group_id);
CREATE INDEX IF NOT EXISTS idx_serial_items_prefix_seq ON serial_items(batch_no, seq);
CREATE UNIQUE INDEX IF NOT EXISTS uq_serial_items_batch_raw ON serial_items(batch_id, raw_serial);
CREATE INDEX IF NOT EXISTS idx_serial_groups_batch ON serial_groups(batch_id);
