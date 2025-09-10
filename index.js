require("dotenv").config();
const express = require("express");
var cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFirebaseToken = async (req, res, next) => {
  const authHeaders = req.headers?.authorization;

  if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeaders.split(" ")[1];
  try {
    const decode = await admin.auth().verifyIdToken(token);
    req.decode = decode;
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
};

const verifyTokenEmail = async (req, res, next) => {
  if (req.params.email !== req.decode.email) {
    return res.status(403).send({ message: "Forbidden Access" });
  }
  next();
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const dataCollections = client.db("uddogDB").collection("uddog");
    const userCollections = client.db("uddogDB").collection("user");
    const joinUserCollections = client.db("uddogDB").collection("joinUser");

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
    app.get(
      "/users/:email",
      verifyFirebaseToken,
      verifyTokenEmail,
      async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const result = await dataCollections.find(query).toArray();
        res.send(result);
      }
    );

    // Join User data Get request
    app.get("/join-user/:email", verifyFirebaseToken, async (req, res) => {
      const email = req.params.email;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${mm}/${dd}/${yyyy}`;
      const query = {
        email: email,
        date: { $gte: todayStr },
      };
      const cursor = joinUserCollections.find(query).sort({ date: -1 });
      const result = await cursor.toArray();
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
      userData.role = "user";
      const alreadyExist = await userCollections.findOne({
        email: userData?.email,
      });
      if (alreadyExist) return;
      const result = await userCollections.insertOne(userData);
      res.send(result);
    });

    // Join User data post request
    app.post("/join-user", async (req, res) => {
      const userData = req.body;
      const result = await joinUserCollections.insertOne(userData);
      res.send(result);
    });

    // Event data update request
    app.put("/event-Data/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedData = req.body;
      const updateDoc = {
        $set: updatedData,
      };
      const result = await dataCollections.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // Delete request
    app.delete("/event-Data/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await dataCollections.deleteOne(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Backend Server is running");
});

app.listen(port, () => {
  console.log(`Backend Server is running on ${port}`);
});
