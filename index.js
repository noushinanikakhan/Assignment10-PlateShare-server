const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json())


// const uri = process.env.MONGODB_URI;
const uri = "mongodb+srv://PlateShareUser:oIxdaYn1eMlwhJ8I@cluster0.a0a09os.mongodb.net/?appName=Cluster0";


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


app.get('/', (req, res) => {
  res.send('Plateshare is running!')
})

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
   
    const db= client.db('plateshare')
    const foodsCollection = db.collection('foods');
    const foodRequestsCollection = db.collection('foodRequests'); // ADD THIS LINE

    app.post('/foods', async(req, res)=> {
        const newFood = req.body;
        const result = await foodsCollection.insertOne(newFood)
        res.send(result)
    })

    // GET

    app.get('/foods', async(req, res)=> {
      const cursor = foodsCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    

    app.get('/foods/:id', async (req, res)=> {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await foodsCollection.findOne(query);
      res.send(result)
    })


    // // ADD THIS ROUTE - Get single food by ID
    // app.get('/foods/:id', async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     const query = { _id: new ObjectId(id) }
    //     const food = await foodsCollection.findOne(query);
        
    //     if (!food) {
    //       return res.status(404).json({ message: 'Food not found' });
    //     }
        
    //     res.send(food);
    //   } catch (error) {
    //     res.status(500).json({ message: error.message });
    //   }
    // })



    // PATCH - Update food (FIXED)
    app.patch('/foods/:id', async(req, res) => {
        try {
            const id = req.params.id;
            const updatedFood = req.body;
            const query = { _id: new ObjectId(id) }
            
            // Use $set to update specific fields
            const updateDoc = {
                $set: updatedFood
            }
            
            const result = await foodsCollection.updateOne(query, updateDoc)
            res.send(result)
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    })

    app.delete('/foods/:id', async (req, res) =>{
     try {
         const id = req.params.id;
      const query = { _id: new ObjectId(id)}
      const result = await foodsCollection.deleteOne(query)
      res.send(result);
     } catch (error) {
            res.status(500).json({ message: error.message });
        }
    })


    // FOOD REQUEST ENDPOINTS

// POST - Create new food request
app.post('/food-requests', async (req, res) => {
    try {
        const newRequest = req.body;
        const result = await foodRequestsCollection.insertOne(newRequest);
        res.send(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        res.status(500).json({ message: error.message });
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
        res.status(500).json({ message: error.message });
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
        res.status(500).json({ message: error.message });
    }
});
    
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Plateshare is running on port ${port}`)
})


// client.connect()
// .then(()=>{
//   app.listen(port, () => {
//   console.log(`Plateshare is running now on port ${port}`)
// })  
// })
// .catch(console.dir)