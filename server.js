const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
app.use(express.json());

const url = "mongodb://localhost:27017";
const dbName = "Supermarket_Mini_Project";

// Register user
app.post('/users/register', async (req, res) => {
    const { fullname , username , email , password } = req.body;
    const client = new MongoClient(url);
    try {
        await client.connect();
        const users = client.db(dbName).collection('Users');

        const check = await users.findOne({ Username: username });
        if (check)
            return res.json({ success: false, message: "User exists" });

        await users.insertOne({ FullName:fullname, Username: username, Email: email, Password: password });
        res.json({ success: true, message: "User registered" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await client.close();
    }
});

// Login user
app.post('/users/login', async (req, res) => {
    const { username, password } = req.body;
    const client = new MongoClient(url);
    try {
        await client.connect();
        const users = client.db(dbName).collection('Users');

        const user = await users.findOne({ Username: username, Password: password });
        if (user) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await client.close();
    }
});

// Add product
app.post('/products/add', async (req, res) => {
    const { pId, pName, pQuantity, pPrice, pCategory } = req.body;
    const total_cost = Number(pQuantity) * Number(pPrice);
    const client = new MongoClient(url);
    try {
        await client.connect();
        const products = client.db(dbName).collection('Products');
        const totalCollection = client.db(dbName).collection('Total_Collection');

        const result = await products.findOne({ "Product Id": pId });
        if (result)
            return res.json({ success: false, message: "Product exists" });

        const nameCheck = await products.findOne({ "Name": pName });
        if (nameCheck) {
            await products.updateOne({ "Name": pName }, { $inc: { "Quantity": Number(pQuantity), "Total": Number(total_cost) } });
            await totalCollection.updateOne({ "Name": pName }, { $inc: { "Quantity": Number(pQuantity), "Total": Number(total_cost) } });
            return res.json({ success: true, message: "Product updated" });
        }

        const doc = {
            "Product Id": pId,
            "Name": pName,
            "Quantity": Number(pQuantity),
            "Price": Number(pPrice),
            "Category": pCategory,
            "Total": total_cost
        };
        await products.insertOne(doc);
        await totalCollection.insertOne(doc);
        res.json({ success: true, message: "Product inserted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await client.close();
    }
});


// Update Product
app.post('/products/update', async (req, res) => {
    const { pId, pName, pQuantity, pPrice, pCategory } = req.body;
    const updated_cost = Number(pQuantity) * Number(pPrice);
    const client = new MongoClient(url);
    try {
        await client.connect();
        const doc = {
            "Name": pName,
            "Quantity": Number(pQuantity),
            "Price": Number(pPrice),
            "Category": pCategory,
            "Total": updated_cost
        };

        const products = client.db(dbName).collection('Products');
        const totalCollection = client.db(dbName).collection('Total_Collection');

        await products.findOneAndUpdate({ "Product Id": pId }, { $set: doc });
        await totalCollection.findOneAndUpdate({ "Product Id": pId }, { $set: doc });

        res.json({ success: true, message: "Product updated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await client.close();
    }
});

// Delete Product
app.post('/products/delete', async (req, res) => {
    const { pId } = req.body;
    const client = new MongoClient(url);
    try {
        await client.connect();
        const products = client.db(dbName).collection('Products');
        const totalCollection = client.db(dbName).collection('Total_Collection');

        const result = await products.findOne({ "Product Id": pId });
        if (!result) {
            return res.json({ success: false, message: "Product not found" });
        }

        await products.deleteOne({ "Product Id": pId });
        await totalCollection.deleteOne({ "Product Id": pId });

        res.json({ success: true, message: "Product deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await client.close();
    }
});

// List products
app.get('/products/list', async (req, res) => {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const products = await client.db(dbName).collection('Products').find({}).toArray();
        res.json(products);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await client.close();
    }
});


// Product Summary

app.get('/products/summary', async (req, res) => {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const summary = await client.db(dbName).collection('Products').aggregate([
            {
                $group: {
                    _id: "$Category",
                    totalQuantity: { $sum: "$Quantity" },
                    totalCollection: { $sum: "$Total" },
                    products: {
                        $push: {
                            Name: "$Name",
                            Quantity: "$Quantity",
                            Total: "$Total"
                        }
                    }
                }
            },
            {
                $project: {
                    Category: "$_id",
                    totalQuantity: 1,
                    totalCollection: 1,
                    products: 1,
                    _id: 0
                }
            }
        ]).toArray();

        res.json(summary);
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await client.close();
    }
});

app.listen(4000, () => {
    console.log('Data service running on http://localhost:4000');
});




app.listen(4000, () => console.log('Mongo Data Service running on port 4000'));
