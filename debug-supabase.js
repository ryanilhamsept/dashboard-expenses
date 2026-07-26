import { createClient } from '@supabase/supabase-js';
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

console.log("=== SUPABASE DEBUG TEST ===");
console.log("URL:", env.VITE_SUPABASE_URL);
console.log("");

// Test 1: Query tanpa auth (anonymous)
console.log("--- Test 1: Query TANPA login (anonymous) ---");
const { data: anonData, error: anonError } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true });

if (anonError) {
    console.log("Error:", anonError.message);
} else {
    console.log("Rows (anonymous):", anonData);
}

// Test 1b: Query with count
const { count: anonCount, error: anonCountErr } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });

console.log("Count (anonymous):", anonCount, "Error:", anonCountErr?.message || "none");

// Test 2: Query dengan login sebagai admin
console.log("\n--- Test 2: Login sebagai admin ---");
const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: "admin@moneytracker.com",
    password: "admin" // ganti jika password berbeda
});

if (loginError) {
    console.log("Login error:", loginError.message);
    console.log("Coba password lain...");
} else {
    console.log("Login berhasil! User ID:", loginData.user.id);
    
    // Test 3: Query SETELAH login
    console.log("\n--- Test 3: Query SETELAH login ---");
    const { data: authData, error: authError, count } = await supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .limit(5);

    if (authError) {
        console.log("Error:", authError.message);
    } else {
        console.log("Total rows (count):", count);
        console.log("Sample rows (first 5):");
        authData.forEach((row, i) => {
            console.log(`  [${i}] id=${row.id}, date=${row.date}, title=${row.title}, amount=${row.amount}, user_id=${row.user_id || 'NULL'}`);
        });
    }
}

// Test 4: Cek struktur tabel
console.log("\n--- Test 4: Query 1 baris untuk cek kolom ---");
const { data: sampleData, error: sampleError } = await supabase
    .from("goals")
    .select("*")
    .limit(1);

if (sampleError) {
    console.log("Error:", sampleError.message);
} else if (sampleData.length === 0) {
    console.log("TABEL KOSONG atau TIDAK BISA DIAKSES (0 baris dikembalikan)");
} else {
    console.log("Kolom tabel:", Object.keys(sampleData[0]).join(", "));
}

console.log("\n=== TEST SELESAI ===");
