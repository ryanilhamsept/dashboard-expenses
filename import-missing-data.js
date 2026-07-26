import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*"?(.*?)"?\s*$/);
    if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Google Sheets URL dari dashboard-expenses (state.js default)
const SHEET_URL = "https://script.google.com/macros/s/AKfycby3wCtf8Inf4DQ49N2EdudHWhJTo1PYp00oJxqHR6OMQRBf8W1chYWM6ow-JwriYuxUAw/exec";

const CUT_OFF_DATE = "2026-03-10"; // Data sebelum tanggal ini yang akan diimpor

const isValidUUID = (str) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

const run = async () => {
    try {
        // 1. Ambil data dari Google Sheets
        console.log("=== IMPORT DATA YANG HILANG (Jan 1 - Mar 9, 2026) ===\n");
        console.log("[1/4] Mengambil data dari Google Sheets...");
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const sheetData = await response.json();
        const allRows = sheetData.rows || [];
        console.log(`✓ Total baris dari Google Sheets: ${allRows.length}`);

        // 2. Filter hanya data sebelum 10 Maret 2026
        const missingRows = allRows.filter(r => {
            if (!r.date) return false;
            return r.date < CUT_OFF_DATE;
        });
        console.log(`✓ Baris sebelum ${CUT_OFF_DATE}: ${missingRows.length}`);

        if (missingRows.length === 0) {
            console.log("\n❌ Tidak ada data yang perlu diimpor. Periksa format tanggal di Google Sheets.");
            // Debug: tampilkan beberapa tanggal dari Sheets
            console.log("Sample tanggal dari Sheets:");
            allRows.slice(0, 5).forEach((r, i) => console.log(`  [${i}] date="${r.date}" title="${r.title}"`));
            allRows.slice(-5).forEach((r, i) => console.log(`  [last-${4-i}] date="${r.date}" title="${r.title}"`));
            return;
        }

        // 3. Ambil ID yang sudah ada di Supabase untuk menghindari duplikasi
        console.log("\n[2/4] Mengecek data yang sudah ada di Supabase...");
        const { data: existingData, error: existingError } = await supabase
            .from("transactions")
            .select("id, date, title, amount")
            .lt("date", CUT_OFF_DATE);
        
        if (existingError) throw existingError;
        console.log(`✓ Data sebelum ${CUT_OFF_DATE} yang sudah ada di Supabase: ${existingData.length}`);

        // Buat set dari ID dan kombinasi date+title+amount yang sudah ada
        const existingIds = new Set(existingData.map(d => d.id));
        const existingFingerprints = new Set(existingData.map(d => `${d.date}|${d.title}|${d.amount}`));

        // 4. Siapkan data untuk dimasukkan (skip yang sudah ada)
        console.log("\n[3/4] Menyiapkan data baru untuk diimpor...");
        const newRows = [];
        let skipped = 0;

        for (const r of missingRows) {
            const id = (r.id && isValidUUID(r.id)) ? r.id : crypto.randomUUID();
            const fingerprint = `${r.date}|${r.title}|${Number(r.amount || 0)}`;

            // Skip jika ID atau fingerprint sudah ada
            if (existingIds.has(id) || existingFingerprints.has(fingerprint)) {
                skipped++;
                continue;
            }

            newRows.push({
                id,
                date: r.date,
                title: r.title || "",
                category: r.category || "Uncategorized",
                amount: Number(r.amount || 0),
                source: r.source || "",
                dana_dipakai: r.danaDipakai || ""
            });
        }

        console.log(`✓ Baris baru untuk diimpor: ${newRows.length}`);
        console.log(`✓ Baris di-skip (sudah ada): ${skipped}`);

        if (newRows.length === 0) {
            console.log("\n✅ Semua data sudah ada di Supabase, tidak perlu impor lagi.");
            return;
        }

        // 5. Insert ke Supabase dalam batch
        console.log(`\n[4/4] Memasukkan ${newRows.length} transaksi ke Supabase...`);
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < newRows.length; i += batchSize) {
            const batch = newRows.slice(i, i + batchSize);
            const { error: insertErr } = await supabase
                .from("transactions")
                .insert(batch);

            if (insertErr) {
                console.error(`❌ Error batch ${i}-${i + batch.length}:`, insertErr.message);
                throw insertErr;
            }
            inserted += batch.length;
            console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} baris berhasil (total: ${inserted}/${newRows.length})`);
        }

        console.log(`\n=== SELESAI! ${inserted} transaksi berhasil diimpor ke Supabase ===`);
        console.log("Silakan refresh halaman dashboard Anda.");

    } catch (err) {
        console.error("\n❌ Error:", err.message || err);
        process.exit(1);
    }
};

run();
