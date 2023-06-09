const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

//medlewerr
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9ekbhpf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJwt = (req, res, next)=>{
    console.log(req.headers.authorization);
    const authorization = req.headers.authorization;
    if(authorization){
        return res.send(401).send({error:true, message: 'unauthorized access'})
    }
    const token =authorization.split(' ')[1];
    console.log('token token', token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=>{
        if(error){
            return res.status(403).send({error: true, message: 'unauthorized access'})
        }
        req.decoded =decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const servicesCollection = client.db('carDoctor').collection('services');
        const bookingCollection = client.db('carDoctor').collection('bookings');

        //jwt
        app.post("/jwt", (req, res)=>{
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
            console.log(token);
            res.send({token});
        })

        app.get("/services", async (req, res) => {
            const cursor = servicesCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {
                projection: { title: 1, price: 1, serviceId: 1, img: 1, service: 1, date: 1  }
            }

            const result = await servicesCollection.findOne(query, options);
            res.send(result);
        })

        app.get("/bookings", verifyJwt, async(req, res)=>{
            console.log(req.headers.authorization);
            let query ={}
            if(req.query?.email){
                query = {email: req.query.email}
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

        app.post("/bookings", async(req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        app.patch("/bookings/:id", async(req, res)=>{
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)}
            const updateBooking = req.body;
            console.log(updateBooking);

            const updateDoc ={
                $set:{
                    status: updateBooking.status
                }
            }

            const result = await bookingCollection.updateOne(filter,updateDoc);
            res.send(result)
        })

        app.delete("/bookings/:id", async(req, res)=>{
            const id = req.query.id;
            const query = {_id: new ObjectId(id)}
            const result= await bookingCollection.deleteOne(query);
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("server is running ")
})

app.listen(port, () => {
    console.log(`car is running is port:${port}`);
})