import express from 'express';
import pg from 'pg';
import 'dotenv/config';

const app = express();
const port = 3000;

app.use(express.json());

const { Client } = pg;
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
};

//pintu 1: cek status server
app.get('/', (req, res) => {
    res.send('Api sudah online');
});

//pintu 2: ambil semua transaksi dari database
app.get('/transaction', async (req, res) => {
    const client = new Client(dbConfig);
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM transaction');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.end();
    }
});

// pintu 3: ringkasan saldo (total uang masuk - total uang keluar)
app.get('/summary', async (req, res) => {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        const result = await client.query(`SELECT * FROM transaction`);
        const data = result.rows;

        let totalIncome = 0;
        let totalExpense = 0;

        data.forEach((item) => {
        const jumlah = parseFloat(item.amount);
        if (item.type === 'income') {
            totalIncome += jumlah;
        } else if (item.type == 'expense') {
            totalExpense += jumlah;
        }
        });

        const saldoAkhir = totalIncome - totalExpense;
        
        res.json({
            total_transaksi: data.length,
            total_masuk: totalIncome,
            total_keluar: totalExpense,
            saldo_akhir: saldoAkhir,
        });

    } catch (err: any) {
        console.error("detail error: ", err.message);
        res.status(500).json({ error: 'Internal Server Error' })
    } finally {
        await client.end();
    }
});

//pintu4: menambah transaksi
app.post('/transaction', async (req, res) => {
    const { item_name, amount, type, date } = req.body;
    const client = new Client(dbConfig);

    if (!item_name || !amount || !type) {
        return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    try {
        await client.connect();
        
        const queryText = 'INSERT INTO transaction (item_name, amount, type) VALUES ($1, $2, $3) RETURNING *';
        const values = [item_name, amount, type];

        const result = await client.query(queryText, values);
        res.status(201).json({ message: 'Transaksi berhasil ditambahkan', data: result.rows[0] });


    } catch (err: any) {
        console.error("error simpan data: ", err.message);
        res.status(500).json({ error: 'Internal Server Error'});
    } finally {
        await client.end();
    }
});

//pintu 5: menghapus transaksi berdasarkan id
app.delete('/transaction/:id', async (req, res) => {
    const id = req.params.id;
    const client = new Client(dbConfig);

    try {
        await client.connect();
        const result = await client.query('DELETE FROM transaction WHERE id = $1', [id]);

        if(result.rowCount === 0) {
            return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
        }

        res.json({ 
            message: 'Transaksi berhasil dihapus',
            deleteData: result.rows[0]
        });
    } catch (err: any) {
        console.error("error hapus data: ", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.end();
        }
});
//pintu 6: mengubah data transaksi
app.put('/transaction/:id', async (req, res) => {
    const id = req.params.id;
    const { item_name, amount, type } = req.body;
    const client = new Client(dbConfig);

    try {
        await client.connect();
        
        const queryText = 'UPDATE transaction SET item_name = $1, amount = $2, type = $3 WHERE id = $4 RETURNING *';
        const values = [item_name, amount, type, id];

        const result = await client.query(queryText, values);

        if(result.rowCount === 0) {
            return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
        }

        res.json({
            message: 'Tranksaksi berhasil diubah',
            updateData: result.rows[0]
        });
        } catch (err: any) {
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            await client.end();
        }
    });


app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
    
