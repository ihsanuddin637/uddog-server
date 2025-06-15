const express = require("express");
var cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mm63pmb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const dataCollections = client.db("uddogDB").collection("uddog");
    const userCollections = client.db("uddogDB").collection("user");

     // Event data Get request
    app.get("/event-Data", async (req, res) => {
      const cursor = dataCollections.find();
      const result = await cursor.toArray();
      res.send(result);
    });
 // Event data get request by upcoming date
    app.get("/event-Data/upcoming", async (req, res) => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${mm}/${dd}/${yyyy}`;
      const cursor = dataCollections.find({ date: { $gte: todayStr } });
      // .sort({ dateField: -1 })
      // .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

// Event data get request by id
    app.get("/event-Data/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await dataCollections.findOne(query);
      res.send(result);
    });

// Event data get request by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await dataCollections.find(query).toArray();
      res.send(result);
    });

     // Event data post request
    app.post("/event-Data", async (req, res) => {
      const eventData = req.body;
      const result = await dataCollections.insertOne(eventData);
      res.send(result);
    });

    // User data post request
    app.post("/users", async (req, res) => {
      const userData = req.body;
      const result = await userCollections.insertOne(userData);
      res.send(result);
    });

      app.put("/groupData/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };

      res.send(result);
    });

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Backend Server is running");
});

app.listen(port, () => {
  console.log(`Backend Server is running on ${port}`);
});
