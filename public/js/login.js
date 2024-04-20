const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const port = 5500;

// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public'));

// MongoDB connection URI
const uri = 'mongodb://localhost:27017';

// Function to validate user input and authenticate
function authenticateUser(userType, crn, password, callback) {
    // Connect to MongoDB
    MongoClient.connect(uri, (err, client) => {
        if (err) {
            console.error('Error connecting to MongoDB:', err);
            callback(err, null);
            return;
        }
        
        // Select collection based on user type
        let collectionName = '';
        switch(userType) {
            case 'student':
                collectionName = 'student';
                break;
            case 'hod':
                collectionName = 'hod';
                break;
            case 'dean':
                collectionName = 'dean';
                break;
            case 'class_coordinator':
                collectionName = 'class_coordinator';
                break;
            default:
                callback(null, false); // Invalid user type
                client.close();
                return;
        }
        
        // Select database and collection
        const db = client.db('classworksystem');
        const collection = db.collection(collectionName);
        
        // Find user based on CRN
        collection.findOne({ crn: crn }, (err, user) => {
            if (err) {
                console.error('Error finding user:', err);
                callback(err, null);
                client.close();
                return;
            }

            if (!user) {
                callback(null, false); // User not found
                client.close();
                return;
            }

            if (user.password !== password) {
                callback(null, false); // Password mismatch
                client.close();
                return;
            }

            callback(null, true); // Authentication successful
            client.close();
        });
    });
}

// POST route for login
app.post('/login', (req, res) => {
    const userType = req.body.userType;
    const crn = req.body.crn;
    const password = req.body.password;

    // Validate inputs
    if (!userType || !crn || !password) {
        res.status(400).send('Missing input fields');
        return;
    }

    // Call authentication function
     authenticateUser(userType, crn, password, (err, isAuthenticated) => {
        if (err) {
            res.status(500).send('Internal server error');
            return;
        }

        if (!isAuthenticated) {
            res.status(401).send('Unauthorized');
            return;
        }

        res.status(200).send('Login successful');
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});