export const colors = ["#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#64748b", "#94a3b8"];

export const formatMoney = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

export const parseAmount = (value) => {
  if (typeof value === "number") return value;
  const cleaned = String(value || "0")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  return Number(cleaned) || 0;
};

export const parseDateValue = (value) => {
  if (value instanceof Date) return value;
  const text = String(value || "").trim();
  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) return direct;

  const slashDate = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashDate) {
    const [, day, month, year] = slashDate;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(Number(fullYear), Number(month) - 1, Number(day));
  }

  const monthMap = {
    jan: 0,
    januari: 0,
    feb: 1,
    februari: 1,
    mar: 2,
    maret: 2,
    apr: 3,
    april: 3,
    mei: 4,
    jun: 5,
    juni: 5,
    jul: 6,
    juli: 6,
    agu: 7,
    agustus: 7,
    sep: 8,
    september: 8,
    okt: 9,
    oktober: 9,
    nov: 10,
    november: 10,
    des: 11,
    desember: 11
  };
  const indoDate = text.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{2,4})$/);
  if (indoDate && monthMap[indoDate[2]] !== undefined) {
    const [, day, monthName, year] = indoDate;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(Number(fullYear), monthMap[monthName], Number(day));
  }

  return new Date();
};

export const normalizeKey = (key) => String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const amountKeys = ["amount", "nominal", "nominalrp", "jumlah", "jumlahuang", "harga", "total", "price", "pengeluaran", "keluar"];
export const dateKeys = ["date", "tanggal", "createdat", "waktu"];
export const categoryKeys = ["category", "kategori", "jenis", "typecategory"];
export const descriptionKeys = ["title", "judul", "subcategory", "subkategori", "merchant", "vendor", "description", "deskripsi", "keterangan", "catatan", "notes", "nama", "transaksi", "transaction", "item", "uraian", "rincian", "detail"];
export const allocationKeys = ["danadipakai", "ambil", "ambildari", "takenfrom", "budgetsource", "allocation", "budget", "sourcebudget", "jenisbudget", "jenisambil", "pakai", "dipakai"];
export const sourceKeys = ["mode", "payment", "metode", "metodepembayaran", "account", "sourceoffund", "sourcefund", "source", "sumberdana", "dari", "rekening", "bank"];

export const pick = (row, names) => {
  const sourceKey = Object.keys(row).find((key) => names.includes(normalizeKey(key)));
  return sourceKey ? row[sourceKey] : "";
};

export const normalizeRow = (row, index = 0) => {
  const knownKeys = [...amountKeys, ...dateKeys, ...categoryKeys, ...descriptionKeys, ...allocationKeys, ...sourceKeys, "id", "uuid", "transactionid", "type", "tipe", "transactiontype", "jenisdata"];
  const isLikelyId = (text) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(text) || /^[a-f0-9]{20,}$/i.test(text);
  const spareTextValues = Object.entries(row)
    .filter(([key, value]) => {
      const normalized = normalizeKey(key);
      const text = String(value || "").trim();
      return text && !knownKeys.includes(normalized) && !parseAmount(text) && !isLikelyId(text);
    })
    .map(([, value]) => String(value).trim());

  const category = pick(row, categoryKeys) || "Uncategorized";
  const explicitType = String(pick(row, ["type", "tipe", "transactiontype", "jenisdata"]) || "").toLowerCase();
  const allocationValues = ["spend bulanan", "ambil dari tabungan", "other"];
  const isAllocationValue = (value) => allocationValues.includes(String(value || "").trim().toLowerCase());
  const explicitDescription = pick(row, descriptionKeys);
  let subcategory = explicitDescription || spareTextValues.find((value) => !isAllocationValue(value));
  let ambil = pick(row, allocationKeys) || spareTextValues.find(isAllocationValue) || "-";
  const source = pick(row, sourceKeys) || spareTextValues[2] || "-";

  if (isAllocationValue(subcategory)) {
    ambil = ambil === "-" ? subcategory : ambil;
    subcategory = spareTextValues.find((value) => value !== subcategory && !isAllocationValue(value)) || "-";
  }
  const inferredType =
    explicitType ||
    (String(category).toLowerCase().includes("income") ? "income" : "") ||
    (String(category).toLowerCase().includes("investment") ? "investment" : "") ||
    (String(category).toLowerCase().includes("subscription") ? "bill" : "expense");

  return {
    rowNumber: Number(row.rowNumber || row.row_number || index || 0),
    date: pick(row, ["date", "tanggal", "createdat", "waktu"]) || new Date().toISOString().slice(0, 10),
    amount: Math.abs(parseAmount(pick(row, amountKeys))),
    category,
    subcategory: subcategory || "-",
    ambil,
    mode: source,
    type: inferredType
  };
};

export const parseCSV = (text) => {
  const rawText = text.trim();
  if (/<!doctype html|<html/i.test(rawText.slice(0, 500))) {
    throw new Error("Sheet belum bisa dibaca sebagai CSV. Set sharing ke Anyone with the link: Viewer, atau upload CSV lewat tombol CSV.");
  }

  const lines = rawText.split(/\r?\n/).filter(Boolean);
  const countDelimiter = (line, delimiter) => {
    let count = 0;
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') quoted = !quoted;
      if (char === delimiter && !quoted) count += 1;
    }
    return count;
  };
  const delimiter = [",", ";", "\t"].sort((a, b) => countDelimiter(lines[0] || "", b) - countDelimiter(lines[0] || "", a))[0];
  const split = (line) => {
    const result = [];
    let value = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        result.push(value);
        value = "";
      } else {
        value += char;
      }
    }
    result.push(value);
    return result.map((item) => item.trim());
  };

  const headerIndex = lines.findIndex((line) => {
    const keys = split(line).map(normalizeKey);
    const hasAmount = keys.some((key) => amountKeys.includes(key));
    const hasContext = keys.some((key) => dateKeys.includes(key) || categoryKeys.includes(key) || key === "keterangan");
    return hasAmount && hasContext;
  });
  if (headerIndex < 0) {
    const previewHeaders = split(lines[0] || "").filter(Boolean).join(", ");
    throw new Error(`Header sheet tidak kebaca. Header yang kebaca: ${previewHeaders || "kosong"}`);
  }

  const headers = split(lines[headerIndex] || "");
  return lines
    .slice(headerIndex + 1)
    .filter(Boolean)
    .map((line) => split(line).reduce((row, value, index) => ({ ...row, [headers[index]]: value }), {}))
    .map((row, idx) => normalizeRow(row, idx + 1));
};

export const normalizeRows = (data) => data.map((row, idx) => normalizeRow(row, idx + 1)).filter((row) => row.amount > 0);

export const getMonthKey = (date) => {
  const parsed = parseDateValue(date);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toISOString().slice(0, 7);
};

export const displayDate = (date) =>
  parseDateValue(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export const compareExpensesByNewest = (a, b) => {
  const dateDiff = parseDateValue(b.date) - parseDateValue(a.date);
  if (dateDiff !== 0) return dateDiff;
  return (b.rowNumber || 0) - (a.rowNumber || 0);
};

export const getCurrentMonthKey = (items) => {
  const sorted = [...items].sort(compareExpensesByNewest);
  const latestValid = sorted.find((item) => !Number.isNaN(parseDateValue(item.date).getTime()));
  return getMonthKey(latestValid ? latestValid.date : new Date());
};

export const groupSum = (items, getKey) =>
  items.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] || 0) + item.amount;
    return acc;
  }, {});
