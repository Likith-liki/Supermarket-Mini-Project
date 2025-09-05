var express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
var app = express();
const url = "mongodb://localhost:27017";
const port = 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.redirect('/register');
})


// Register Form

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
})
app.post('/register', async (req, res) => {
    const doc = {
        "Username": `${req.body.username}`,
        "Password": `${req.body.password}`
    };
    const client = new MongoClient(url);
    try {
        await client.connect();


        const check = await client.db('Supermarket_Mini_Project').collection('Users').findOne({ "Username": `${req.body.username}` });

        if (check) {
            res.redirect('/register?error=exists')
        } else {
            const result = await client.db('Supermarket_Mini_Project').collection('Users').insertOne(doc);
            console.log("Successfully Inserted");
            res.redirect('/login?success=registered');
        }
    }
    catch (err) {
        console.error("Error Inserting Document");
        res.send(`<h1>Error Adding Document</h1>`);
    }
    finally {
        await client.close();
    }
});


//Login Form


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
})

app.post('/login', async (req, res) => {
    const doc = {
        "Username": `${req.body.username}`,
        "Password": `${req.body.password}`
    };
    const client = new MongoClient(url);
    try {
        await client.connect();
        const result = await client.db('Supermarket_Mini_Project').collection('Users').findOne(doc);
        if (result) {
            res.redirect('dashboard.html');
        } else {
            res.redirect('/login?error=invalid');
        }
    }
    catch (err) {
        console.error("Error While Login");
        res.send(`<h1>Error While Login</h1>`);
    }
    finally {
        await client.close();
    }
});


//Add Product

app.get('/addProduct', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'addProduct.html'));
})

app.post('/addProduct', async (req, res) => {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const { pId, pName, pQuantity, pPrice, pCategory } = req.body;
        const total_cost = Number(pQuantity) * Number(pPrice);
        const result = await client.db('Supermarket_Mini_Project').collection('Products').findOne({ "Product Id": pId });
        if (result) {
            return res.redirect('/addProduct?error=exists')
        }
        const nameCheck = await client.db('Supermarket_Mini_Project').collection('Products').findOne({ "Name": pName });
        if (nameCheck) {
            await client.db('Supermarket_Mini_Project').collection('Products').updateOne({ "Name": pName }, { $inc: { "Quantity": Number(pQuantity), "Total": Number(total_cost) } });
            await client.db('Supermarket_Mini_Project').collection('Total_Collection').updateOne({ "Name": pName }, { $inc: { "Quantity": Number(pQuantity), "Total": Number(total_cost) } });
            res.redirect('/addProduct?success=updated');
        }
        else {
            const doc = {
                "Product Id": pId,
                "Name": pName,
                "Quantity": Number(pQuantity),
                "Price": Number(pPrice),
                "Category": pCategory,
                "Total": (Number(pQuantity) * Number(pPrice))
            }
            await client.db('Supermarket_Mini_Project').collection('Products').insertOne(doc);
            await client.db('Supermarket_Mini_Project').collection('Total_Collection').insertOne(doc);
            res.redirect('/addProduct?success=inserted');
        }
    }
    catch (err) {
        console.error("Error While Inserting");
        res.send(`<h1>Error While Inserting</h1>`);
    }
    finally {
        await client.close();
    }
})

//Update Product

app.get('/updateProduct', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'updateProduct.html'));
})

app.post('/updateProduct', async (req, res) => {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const { pId, pName, pQuantity, pPrice, pCategory } = req.body;
        const updated_cost = Number(pQuantity) * Number(pPrice);
        const doc = {
            "Name": pName,
            "Quantity": Number(pQuantity),
            "Price": Number(pPrice),
            "Category": pCategory,
            "Total": updated_cost,
        }
        await client.db('Supermarket_Mini_Project').collection('Products').findOneAndUpdate({ "Product Id": pId }, { $set: doc });
        await client.db('Supermarket_Mini_Project').collection('Total_Collection').findOneAndUpdate({ "Product Id": pId }, { $set: doc });
        console.log("Product Updated Successfully");
        res.redirect('/updateProduct?success=updated');
    }
    catch (err) {
        console.error("Error While Updating");
        res.send(`<h1>Error While Updating</h1>`);
    }
    finally {
        await client.close();
    }
})


// Remove Product

app.get('/deleteProduct', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'deleteProduct.html'));
})

app.post('/deleteProduct', async (req, res) => {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const { pId } = req.body;
        const result = await client.db('Supermarket_Mini_Project').collection('Total_Collection').findOne({ "Product Id": pId });
        if (result) {
            await client.db('Supermarket_Mini_Project').collection('Products').deleteOne({ "Product Id": pId });
            await client.db('Supermarket_Mini_Project').collection('Total_Collection').deleteOne({ "Product Id": pId });
            console.log("Product Deleted Successfully");
            res.redirect('/deleteProduct?success=deleted');
        } else {
            res.redirect('/deleteProduct?error=notexists');
        }
    }
    catch (err) {
        console.error("Error While Deleting");
        res.send(`<h1>Error While Deleting</h1>`);
    }
    finally {
        await client.close();
    }
})

// List all Products 

app.get('/listProducts', async (req, res) => {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const products = await client.db('Supermarket_Mini_Project').collection('Products').find({}).toArray();
        res.render('listProducts', { products });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).send("<h1>Error Fetching Products</h1>");
    } finally {
        await client.close();
    }
});



// Product Summary

app.get('/productSummary', async (req, res) => {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const summary = await client.db('Supermarket_Mini_Project').collection('Products').aggregate([{
            $group: {
                _id: "$Category",
                totalQuantity: { $sum: "$Quantity" },
                totalCollection: { $sum: "$Total" }
            }
        },
        {$project: {
                Category: "$_id",
                totalQuantity: 1,
                totalCollection: 1,
                _id: 0
            }}]).toArray();
        res.render('productSummary', { summary });
    } catch (err) {
        console.error("Error generating summary:", err);
        res.status(500).send("<h1>Error Generating Summary</h1>");
    } finally {
        await client.close();
    }
});




app.listen(port, (req, res) => {
    console.log(`Server is running at localhost:${port}`);
});
