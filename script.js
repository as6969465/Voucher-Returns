/* ============================================================
 * 禮券退貨彙整平台 - 核心邏輯模組
 * 模組：序號解析 (parseSerial) / 連號分組 (groupSerials)
 *       即時歸組比對 (findBestGroup) / 區段重建 (rebuildSegments)
 * ============================================================ */

const SERIAL_REGEX = /^([A-Z])(\d+?)(\d{7})-(\d)$/;

/** 將原始字串解析為序號物件 */
function parseSerial(raw) {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const normalized = trimmed.toUpperCase().normalize("NFKC").replace(/\s+/g, "");
  const match = SERIAL_REGEX.exec(normalized);

  if (!match) {
    return { raw: trimmed, error: "格式不符" };
  }

  const [, type, batchNo, seqStr, checksum] = match;
  return {
    raw: trimmed,
    type,
    batchNo,
    seq: parseInt(seqStr, 10),
    seqStr,
    checksum,
    prefix: type + batchNo,
  };
}

/** 批次模式：將已解析序號依前綴分桶並找出連號區段 */
function groupSerials(parsedList) {
  const buckets = new Map();
  for (const item of parsedList) {
    if (!buckets.has(item.prefix)) buckets.set(item.prefix, []);
    buckets.get(item.prefix).push(item);
  }

  const groups = [];
  for (const [prefix, items] of buckets.entries()) {
    items.sort((a, b) => a.seq - b.seq);

    let segStart = 0;
    for (let i = 1; i <= items.length; i++) {
      const prev = items[i - 1];
      const cur = items[i];
      if (i === items.length || cur.seq !== prev.seq + 1) {
        const segItems = items.slice(segStart, i);
        groups.push({
          prefix,
          from: segItems[0],
          to: segItems[segItems.length - 1],
          count: segItems.length,
          items: segItems,
        });
        segStart = i;
      }
    }
  }

  groups.sort((a, b) => {
    if (a.prefix !== b.prefix) return a.prefix < b.prefix ? -1 : 1;
    return a.from.seq - b.from.seq;
  });

  return groups;
}

/** 依 items 重新計算連號區段 */
function rebuildSegments(items) {
  const sorted = [...items].sort((a, b) => a.seq - b.seq);
  const segments = [];
  let segStart = 0;
  for (let i = 1; i <= sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (i === sorted.length || cur.seq !== prev.seq + 1) {
      const segItems = sorted.slice(segStart, i);
      segments.push({
        from: segItems[0],
        to: segItems[segItems.length - 1],
        count: segItems.length,
      });
      segStart = i;
    }
  }
  return segments;
}

/** 即時歸組模式：在現有群組中尋找最佳歸屬 */
function findBestGroup(parsed, groups, tolerance) {
  let best = null;
  let bestDist = Infinity;

  for (const group of groups) {
    if (group.prefix !== parsed.prefix) continue;
    let dist = Infinity;
    for (const item of group.items) {
      dist = Math.min(dist, Math.abs(item.seq - parsed.seq));
    }
    if (dist <= tolerance && dist < bestDist) {
      best = group;
      bestDist = dist;
    }
  }

  return best ? { group: best, distance: bestDist } : null;
}

/** 批次模式前處理：多行字串 -> parsed 陣列 + 統計 */
function processBatchInput(rawText) {
  const lines = rawText
    .split(/[\n,\t]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const seen = new Set();
  const valid = [];
  const errors = [];
  let duplicateCount = 0;

  for (const line of lines) {
    const parsed = parseSerial(line);
    if (!parsed) continue;
    if (parsed.error) {
      errors.push(parsed);
      continue;
    }
    if (seen.has(parsed.raw)) {
      duplicateCount++;
      continue;
    }
    seen.add(parsed.raw);
    valid.push(parsed);
  }

  const groups = groupSerials(valid);

  return {
    totalInput: lines.length,
    validCount: valid.length,
    groupCount: groups.length,
    duplicateCount,
    errorCount: errors.length,
    groups,
    errors,
  };
}

/** 匯出 TSV：前綴 / 起始流水號 / 結束流水號 / 張數 */
function exportGroupsAsTSV(groups) {
  const header = ["前綴", "起始流水號", "結束流水號", "張數"].join("\t");
  const rows = groups.map((g) =>
    [g.prefix, g.from.seqStr, g.to.seqStr, g.count].join("\t")
  );
  return [header, ...rows].join("\n");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseSerial,
    groupSerials,
    rebuildSegments,
    findBestGroup,
    processBatchInput,
    exportGroupsAsTSV,
  };
}
