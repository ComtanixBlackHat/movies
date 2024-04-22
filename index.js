// // server.js
require('dotenv').config();
const controller = require('./server/controller/controller') 
// const express = require('express');
// const app = express();
// const port = 3000;

// // Set EJS as the view engine
// app.set('view engine', 'ejs');

// app.get('/add', (req, res) => {
//     res.render('addMovie.ejs');
// });
// // Route to render the Add Movie form
// app.post('/addmovie', controller.addMovie)

// // // Route to render the Edit Movie form
// // app.get('/edit/:id', (req, res) => {
// //     // Assuming you have an ID parameter for the movie to be edited
// //     const movieId = req.params.id;
// //     res.render('editMovie', { movieId });
// // });

// // // Route to render the Delete Movie confirmation page
// // app.get('/delete/:id', (req, res) => {
// //     // Assuming you have an ID parameter for the movie to be deleted
// //     const movieId = req.params.id;
// //     res.render('deleteMovie', { movieId });
// // });

// // Start the server
// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });
// server.js or your main file
const express = require('express');
const app = express();
const port = 3000;
// const movieRoutes = require('./movieRoutes');
const path = require('path');

// Body parsing middleware
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.json()); // For parsing application/json

// Set up EJS and static file serving
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/add', (req, res) => {
    res.render('addMovie.ejs');
});
app.get('/dashboard', (req, res) => {
    res.render('index.ejs');
});

app.get('/list-files', (req, res) => {
    const DIRECTORY_PATH= process.env.FILE_UPLOAD_PATH; // Retrieve directory path from environment variables
   
    controller.printAllFileNames(DIRECTORY_PATH, res); 
});

app.delete('/delete-file/:fileName', controller.deleteFile);

app.post('/edit-movie/:fileName', controller.editMovie);
app.get('/read-file/:fileName', controller.readFile);
app.get('/showeditpage', (req, res) => {
    res.render('editMovie.ejs');
});
// Route to render the Add Movie form
app.post('/addmovie', controller.addMovie)

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
