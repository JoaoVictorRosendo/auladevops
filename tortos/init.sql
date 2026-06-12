CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100),
    item_id INT,
    price DECIMAL(10,2) DEFAULT 15.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Aberto',
    cep VARCHAR(20),
    rua VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    FOREIGN KEY (item_id) REFERENCES items(id)
);
INSERT INTO users (username, password)
VALUES ('admin', '$2b$10$ViaCBS.xq30inzns4uxUAelpJGcWwygdBG3Ot26p353lYdUD1IG4C');
INSERT INTO items (name, category) VALUES ('Arroz Branco', 'Base'), ('Feijao Preto', 'Grao');
