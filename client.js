const express = require('express');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

const DATA_SERVICE_URL = "http://localhost:4000";

// Home redirect
app.get('/', (req, res) => {
    res.redirect('/register');
});

// Register
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
    const response = await fetch(`http://localhost:4000/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    });
    const result = await response.json();
    if (result.success) {
        res.redirect('/login?success=registered');
    } else {
        res.redirect('/register?error=exists');
    }
});

// Login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
    const response = await fetch(`http://localhost:4000/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    });
    const result = await response.json();
    if (result.success) {
        res.redirect('/dashboard.html');
    } else {
        res.redirect('/login?error=invalid');
    }
});

// Add product
app.get('/addProduct', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'addProduct.html'));
});

app.post('/addProduct', async (req, res) => {
    const response = await fetch(`http://localhost:4000/products/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    });
    const result = await response.json();
    if (result.success) {
        res.redirect('/addProduct?success=inserted');
    } else {
        res.redirect('/addProduct?error=exists');
    }
});

// Update Product
app.get('/updateProduct', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'updateProduct.html'));
});

app.post('/updateProduct', async (req, res) => {
    const response = await fetch(`http://localhost:4000/products/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    });
    const result = await response.json();
    if (result.success) {
        res.redirect('/updateProduct?success=updated');
    } else {
        res.redirect('/updateProduct?error=failed');
    }
});

// Delete Product
app.get('/deleteProduct', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'deleteProduct.html'));
});

app.post('/deleteProduct', async (req, res) => {
    const response = await fetch(`http://localhost:4000/products/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    });
    const result = await response.json();
    if (result.success) {
        res.redirect('/deleteProduct?success=deleted');
    } else {
        res.redirect('/deleteProduct?error=notexists');
    }
});

// List products
app.get('/listProducts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'listProducts.html'));
});

app.get('/api/products', async (req, res) => {
    const response = await fetch(`http://localhost:4000/products/list`);
    const products = await response.json();
    res.json(products);
});


// Product Summary

app.get('/productSummary', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'productSummary.html'));
});

// Proxy endpoint to fetch data from data service
app.get('/productSummaryData', async (req, res) => {
    try {
        const response = await fetch('http://localhost:4000/products/summary');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch summary' });
    }
});

app.listen(3000, () => {
    console.log('API server running on http://localhost:3000');
});
