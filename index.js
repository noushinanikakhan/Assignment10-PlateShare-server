const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json())

const uri = "mongodb+srv://PlateShareUser:oIxdaYn1eMlwhJ8I@cluster0.a0a09os.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Initialize collections as null initially
let foodsCollection = null;
let foodRequestsCollection = null;

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    if (!foodsCollection) {
      await client.connect();
      const db = client.db('plateshare');
      foodsCollection = db.collection('foods');
      foodRequestsCollection = db.collection('foodRequests');
      console.log("MongoDB connected successfully!");
    }
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.get('/', (req, res) => {
  res.send('Plateshare is running!')
})

// GET all foods
app.get('/foods', async (req, res) => {
  try {
    const cursor = foodsCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching foods:", error);
    res.status(500).json({ error: "Failed to fetch foods" });
  }
});

// GET single food by ID
app.get('/foods/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await foodsCollection.findOne(query);
    
    if (!result) {
      return res.status(404).json({ error: "Food not found" });
    }
    
    res.send(result);
  } catch (error) {
    console.error("Error fetching food:", error);
    
    if (error.message.includes('24 hex')) {
      return res.status(400).json({ error: "Invalid food ID format" });
    }
    
    res.status(500).json({ error: "Failed to fetch food" });
  }
});

// POST new food
app.post('/foods', async (req, res) => {
  try {
    const newFood = req.body;
    const result = await foodsCollection.insertOne(newFood);
    res.send(result);
  } catch (error) {
    console.error("Error creating food:", error);
    res.status(500).json({ error: "Failed to create food" });
  }
});

// PATCH - Update food
app.patch('/foods/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedFood = req.body;
    const query = { _id: new ObjectId(id) };
    
    const updateDoc = {
      $set: updatedFood
    };
    
    const result = await foodsCollection.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error updating food:", error);
    res.status(500).json({ error: "Failed to update food" });
  }
});

// DELETE food
app.delete('/foods/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await foodsCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error("Error deleting food:", error);
    res.status(500).json({ error: "Failed to delete food" });
  }
});

// FOOD REQUEST ENDPOINTS

// POST - Create new food request
app.post('/food-requests', async (req, res) => {
  try {
    const newRequest = req.body;
    const result = await foodRequestsCollection.insertOne(newRequest);
    res.send(result);
  } catch (error) {
    console.error("Error creating food request:", error);
    res.status(500).json({ error: "Failed to create food request" });
  }
});

// GET - Get all requests for a specific food
app.get('/food-requests/:foodId', async (req, res) => {
  try {
    const foodId = req.params.foodId;
    const query = { foodId: foodId };
    const cursor = foodRequestsCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching food requests:", error);
    res.status(500).json({ error: "Failed to fetch food requests" });
  }
});

// PATCH - Update request status (accept/reject)
app.patch('/food-requests/:requestId', async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const { status } = req.body;
    const query = { _id: new ObjectId(requestId) };
    
    const updateDoc = {
      $set: { 
        status: status,
        processedAt: new Date()
      }
    };
    
    const result = await foodRequestsCollection.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error updating food request:", error);
    res.status(500).json({ error: "Failed to update food request" });
  }
});

// GET - Get all food requests by requester email
app.get('/my-food-requests/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const query = { requesterEmail: email };
    const cursor = foodRequestsCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching user food requests:", error);
    res.status(500).json({ error: "Failed to fetch user food requests" });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    if (foodsCollection) {
      await foodsCollection.findOne({});
      res.json({ 
        status: 'OK', 
        database: 'Connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({ 
        status: 'Service Unavailable', 
        database: 'Disconnected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'Service Unavailable', 
      database: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// VERCEL REQUIREMENT: Export the app for serverless functions
module.exports = app;