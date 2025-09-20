
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    available BOOLEAN DEFAULT true
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    source VARCHAR(20) NOT NULL CHECK (source IN ('POS', 'KIOSK')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', 
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id),
    quantity INT NOT NULL
);

CREATE TABLE queue_tokens (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    token_number INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' 
);
