const express = require('express');
const cors = require('cors');


const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());


// Middleware to parse JSON
app.use(express.json());

const API_KEY = "Insert API Key here";
const BASE_URL = 'https://superheroapi.com/api';


// Gets inmate by id
app.get('/api/superhero/:id', async (req, res) => {
    const { id } = req.params;
    const url = `${BASE_URL}/${API_KEY}/${id}`;
    try {
    console.log(`Fetching: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
    }
    catch(error){
        console.error('Error fetching superhero:', error);
        res.status(500).json({ error: 'Failed to fetch superhero data' });
    }
});

// Gets inmate by name
app.get('/api/search/:name', async (req, res) => {
    const { name } = req.params;
    const url = `${BASE_URL}/${API_KEY}/search/${name}`;
  
    try{
        console.log(`Searching: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data);
    } 
    catch(error){
        console.error('Error searching superhero:', error);
        res.status(500).json({ error: 'Failed to search superhero data' });
    }
});



//Health check
app.get('/', (req, res) => {
  res.json({ message: 'SuperHero API Proxy Server is running!' });
});

// Starts listening on port 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});