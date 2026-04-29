import { Client } from 'pg';

const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'finance_tracker',
    password: 'mrg09876',
    port: 5432,
});

async function cekKoneksi() {
    console.log("Memulai pengecekan...");
    try {
        await client.connect();
        console.log('Koneksi berhasil');

        const res = await client.query('SELECT NOW()');
        console.log("jam di database saat ini: ", res.rows[0].now);
        await client.end();
    } catch {
        console.log('Koneksi gagal');
    }
}

cekKoneksi();

