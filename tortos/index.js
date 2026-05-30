const express    = require('express');
const bodyParser = require('body-parser');
const mysql      = require('mysql2/promise');
const path       = require('path');
const bcrypt     = require('bcrypt');
const fs         = require('fs');

const app = express();
app.disable('x-powered-by');

// Lê o arquivo application.properties como dicionário chave=valor
let properties = {};
try {
    const propsFile = fs.readFileSync(path.join(__dirname, 'application.properties'), 'utf-8');
    propsFile.split('\n').forEach(line => {
        if (line && !line.startsWith('#') && line.includes('=')) {
            const index = line.indexOf('=');
            const key   = line.substring(0, index).trim();
            const val   = line.substring(index + 1).trim();
            if (key && val) properties[key] = val;
        }
    });
} catch (e) {
    console.log('⚠️ [CONFIG] Não foi possível ler application.properties');
}

const dbConfig = {
    host:     process.env.DB_HOST || 'db',
    user:     process.env.DB_USER || 'user',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'marmitadb'
};

let pool;

// Tenta conectar ao MySQL até 10 vezes com intervalo de 3s entre tentativas
async function connectWithRetry() {
    console.log('🔍 [INFRA] Tentando conectar ao MySQL...');
    for (let i = 1; i <= 10; i++) {
        try {
            pool = mysql.createPool(dbConfig);
            await pool.query('SELECT 1');
            console.log('✅ [DATABASE] Conectado ao MySQL com sucesso!');

            // Adiciona colunas novas caso ainda não existam (migração não destrutiva)
            try {
                await pool.query('ALTER TABLE orders ADD COLUMN price DECIMAL(10,2) DEFAULT 15.00');
                await pool.query('ALTER TABLE orders ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
                await pool.query('ALTER TABLE orders ADD COLUMN cep VARCHAR(20)');
                await pool.query('ALTER TABLE orders ADD COLUMN rua VARCHAR(255)');
                await pool.query('ALTER TABLE orders ADD COLUMN bairro VARCHAR(100)');
                await pool.query('ALTER TABLE orders ADD COLUMN cidade VARCHAR(100)');
                await pool.query('ALTER TABLE orders ADD COLUMN estado VARCHAR(2)');
            } catch (e) {
                // ER_DUP_FIELDNAME significa que a coluna já existe — comportamento esperado
                if (e.code !== 'ER_DUP_FIELDNAME') {
                    console.log('⚠️ [DATABASE] Aviso ao verificar colunas:', e.message);
                }
            }

            return;
        } catch (err) {
            console.log(`⚠️ [DATABASE] Tentativa ${i}/10 falhou. Aguardando...`);
            await new Promise(res => setTimeout(res, 3000));
        }
    }
    process.exit(1);
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0)
            return res.send('<h1>Usuário não encontrado</h1><a href="/">Voltar</a>');

        const senhaValida = await bcrypt.compare(password, rows[0].password);

        if (senhaValida) return res.redirect('/dashboard');
        return res.send('<h1>Senha inválida</h1><a href="/">Voltar</a>');

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no banco.');
    }
});

app.get('/dashboard', async (req, res) => {
    const [items]  = await pool.query('SELECT * FROM items');
    const [orders] = await pool.query(
        'SELECT orders.*, items.name as item_name FROM orders LEFT JOIN items ON orders.item_id = items.id'
    );
    res.render('dashboard', { items, orders });
});

app.get('/create-order', async (req, res) => {
    const itemId = req.query.itemId;
    if (!itemId) return res.redirect('/dashboard');

    const [items] = await pool.query('SELECT * FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) return res.redirect('/dashboard');

    const viacepUrl = properties['viacep.api.url'] || 'https://viacep.com.br/ws/';
    res.render('create-order', { item: items[0], viacepUrl });
});

app.post('/create-order', async (req, res) => {
    const { item_id, customer_name, cep, rua, bairro, cidade, estado } = req.body;
    const finalName = customer_name && customer_name.trim() !== '' ? customer_name : 'Cliente Balcão';
    try {
        await pool.query(
            'INSERT INTO orders (customer_name, item_id, status, cep, rua, bairro, cidade, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [finalName, item_id, 'Aberto', cep, rua, bairro, cidade, estado]
        );
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao criar pedido.');
    }
});

app.post('/add-item', async (req, res) => {
    const { name, category } = req.body;
    try {
        await pool.query('INSERT INTO items (name, category) VALUES (?, ?)', [name, category]);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao cadastrar item.');
    }
});

app.get('/kanban', async (req, res) => {
    const [orders] = await pool.query(
        'SELECT orders.*, items.name as item_name FROM orders LEFT JOIN items ON orders.item_id = items.id'
    );
    res.render('kanban', { orders });
});

app.post('/activate-order', async (req, res) => {
    const { id } = req.body;
    try {
        await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['Aberto', id]);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao ativar pedido');
    }
});

app.post('/update-status', async (req, res) => {
    const { id, status } = req.body;

    const fluxo = { 'Aberto': 'Cozinha', 'Cozinha': 'Entrega', 'Entrega': 'Entregue' };
    const nextStatus = fluxo[status];
    if (!nextStatus) return res.status(400).json({ success: false, error: 'Status inválido' });

    try {
        await pool.query('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, id]);
        res.json({ success: true, newStatus: nextStatus });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Erro ao atualizar pedido' });
    }
});

app.post('/quick-order', async (req, res) => {
    const { item_id, customer_name } = req.body;
    const finalName = customer_name && customer_name.trim() !== '' ? customer_name : 'Cliente Balcão';
    try {
        const [result] = await pool.query(
            'INSERT INTO orders (customer_name, item_id, status) VALUES (?, ?, ?)',
            [finalName, item_id, 'Aberto']
        );
        res.json({ success: true, orderId: result.insertId, customer_name: finalName, status: 'Aberto' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Erro ao criar pedido' });
    }
});

app.get('/admin/export', async (req, res) => {
    try {
        const [orders] = await pool.query(
            'SELECT orders.*, items.name as item_name FROM orders LEFT JOIN items ON orders.item_id = items.id'
        );

        // BOM UTF-8 garante que o Excel brasileiro leia acentos corretamente
        let csv = '\ufeffID;Cliente;Item;Status;Valor;Data\n';

        orders.forEach(order => {
            const valor = `R$ ${parseFloat(order.price || 15.00).toFixed(2).replace('.', ',')}`;
            const data  = order.created_at
                ? new Date(order.created_at).toLocaleString('pt-BR')
                : 'Sem data';
            csv += `${order.id};${order.customer_name || 'N/A'};${order.item_name || 'N/A'};${order.status || 'N/A'};${valor};${data}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio_pedidos.csv"');
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao exportar CSV.');
    }
});

connectWithRetry().then(() => {
    app.listen(4000, () => console.log("🚀 TORTO'S ONLINE NA PORTA 4000"));
});
