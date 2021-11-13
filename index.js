const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config()
const app= express()
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://myFirstMogo:${process.env.DB_PASS}@cluster0.2xl13.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("BabyToys");
        const productsCollection = database.collection("products");


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
