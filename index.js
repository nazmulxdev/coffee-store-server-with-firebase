import express from "express";
const app = express();
app.use(express.json());
import cors from "cors";
app.use(cors());
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import firebaseAdmin from "firebase-admin";
// import serviceAccount from "./firebase-private-code/firebase-auth.json" assert { type: "json" };

const serviceAccountPath = path.resolve(
  "./firebase-private-code/firebase-auth.json"
);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

const port = process.env.PORT || 3000;
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

dotenv.config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qtoljre.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const coffeesCollection = client.db("coffeeDB").collection("coffees");

    const usersCollection = client.db("coffeeDB").collection("users");

    app.get("/coffees", async (req, res) => {
      // const cursor = coffeesCollection.find();
      // const result = await cursor.toArray();
      const result = await coffeesCollection.find().toArray();
      res.send(result);
    });

    app.get("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coffeesCollection.findOne(query);
      res.send(result);
    });

    app.post("/coffees", async (req, res) => {
      const newCoffee = req.body;
      console.log(newCoffee);
      const result = await coffeesCollection.insertOne(newCoffee);
      res.send(result);
    });

    app.put("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedCoffee = req.body;
      const updatedDoc = {
        $set: updatedCoffee,
      };

      // const updatedDoc = {
      //     $set: {
      //         name: updatedCoffee.name,
      //         supplier: updatedCoffee.supplier
      //     }
      // }

      const result = await coffeesCollection.updateOne(
        filter,
        updatedDoc,
        options
      );

      res.send(result);
    });

    app.delete("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coffeesCollection.deleteOne(query);
      res.send(result);
    });

    // user related api

    // read or get method of user related api
    app.get("/users", async (req, res) => {
      const users = usersCollection.find();
      const result = await users.toArray();
      res.send(result);
    });

    // post method for user api

    app.post("/users", async (req, res) => {
      const userProfile = req.body;
      const result = await usersCollection.insertOne(userProfile);
      res.send(result);
    });

    // patch operation exploring

    app.patch("/users", async (req, res) => {
      const { email, lastSignInTime } = req.body;
      const filter = { email };
      const updatedDoc = {
        $set: {
          lastSignInTime: lastSignInTime,
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // delete user from data base

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const { uid } = req.body;
      const query = {
        _id: new ObjectId(id),
      };
      if (!uid || typeof uid !== "string") {
        return res
          .status(400)
          .json({ error: "UID is required and must be a string" });
      }

      const result = await usersCollection.deleteOne(query);
      const fireBaseDelete = await firebaseAdmin.auth().deleteUser(uid);
      res.send({ fireBaseDelete, result });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Coffee server is getting hotter.");
});

app.listen(port, () => {
  console.log(`Coffee server is running on port ${port}`);
});
