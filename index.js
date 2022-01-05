const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const admin = require("firebase-admin");
const port = process.env.PORT || 5000;
require('dotenv').config()
const ObjectId = require('mongodb').ObjectId
const app = express()
app.use(cors())
app.use(express.json())

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const uri = `mongodb+srv://myFirstMogo:${process.env.DB_PASS}@cluster0.2xl13.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers?.authorization?.split(' ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        } catch {

        }
    }
    next();
}
async function run() {
    try {
        await client.connect();
        const database = client.db("BabyToys");
        const productsCollection = database.collection("products");
        const orderCollection = database.collection("orders");
        const userCollection = database.collection("users");
        const reviewsCollection = database.collection("reviews");

        // save user to database
        app.post('/users', async (req, res) => {
            const user = await userCollection.insertOne(req.body);
            res.json(user)
        })
        // get single user
        app.get('/checkadmin/:email', async (req, res) => {
            const query = { email: req.params.email };
            const result = await userCollection.findOne(query);
            res.send(result)
        })

        // post products
        app.post('/products', async (req, res) => {
            const product = req.body;
            const products = await productsCollection.insertOne(product);
            res.json(products)
        })
        // post review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const reviews = await reviewsCollection.insertOne(review);
            res.json(reviews)
        })
        // post order
        app.post('/myOrder', async (req, res) => {
            const order = await orderCollection.insertOne(req.body);
            res.json(order)
        })
        // Get all products
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({})
            const products = await cursor.toArray()
            res.send(products)
        })
        // get all review
        app.get('/reviews', async (req, res) => {
            const reviews = await reviewsCollection.find({}).toArray();
            res.send(reviews)
        })
        // get single product
        app.get('/products/:productId', async (req, res) => {
            const id = req.params.productId;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query)
            res.send(product)
        })
        // get all order
        app.get('/allOrder', async (req, res) => {
            const result = await orderCollection.find({}).toArray()
            res.send(result)
        })
        // get my order
        app.get('/myOrder/:email', async (req, res) => {
            const result = await orderCollection.find({
                userEmail: req.params.email,
            }).toArray();
            res.send(result)
        })
        // upate status
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 'Shipped'
                },
            };
            const result = await orderCollection.updateOne(filter, updateDoc, options);
            res.json(result)
        })
        // make admin
        app.put('/users/:admin', verifyToken, async (req, res) => {
            const email = req.params.admin;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await userCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: email }
                    const updateDoc = {
                        $set: {
                            role: 'admin'
                        },
                    };
                    const result = await userCollection.updateOne(filter, updateDoc);
                    res.json(result)
                }
            }else{res.status(403).json({message:"you can't make admit request"})}
        })
        // delete Order
        app.delete('/orders/:orderId', async (req, res) => {
            const id = req.params.orderId;
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query);
            res.json(result)
        })
        // delete Products
        app.delete('/products/:productId', async (req, res) => {
            const id = req.params.productId;
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(query);
            res.json(result)
        })
    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('server hiting')
})
app.listen(port, () => {
    console.log(`listening from http://localhost:${port}`)
})
