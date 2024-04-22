// movieController.js
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const YAML = require('js-yaml');

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.IMAGE_UPLOAD_PATH); // Specify the directory where images will be saved
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Upload both images to the same directory
const upload = multer({ storage: storage }).fields([
    { name: 'posterImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
]);

// Controller function to handle form submission for adding a movie
const addMovie = (req, res) => {
    console.log(req.files);
    // Upload images
    upload(req, res, function (err) {
        if (err) {
            console.error('Error uploading images:', err);
            return res.status(500).send('Error uploading images');
        }
        
        // Extract movie data from the form submission
        const movieData = {
            title: req.body.title,
            meta_title: req.body.meta_title || "",
            description: req.body.description,
            date: req.body.date,
            image: req.files['posterImage'][0].filename,
            banner: req.files['bannerImage'][0].filename,
            categories: req.body.categories,
            author: req.body.author,
            tags: req.body.tags.split(','),
            rating: parseFloat(req.body.rating),
            draft: req.body.draft === 'true',
            year: parseInt(req.body.year)
        };

        // Save the movie data to a markdown file
        const fileName = `${movieData.title.replace(/\s/g, '-').toLowerCase()}.md`;
        const filePath = path.join(process.env.FILE_UPLOAD_PATH, fileName);
        const content = generateMarkdownContent(movieData);

        fs.writeFile(filePath, content, (err) => {
            if (err) {
                console.error('Error saving movie data to file:', err);
                return res.status(500).send('Internal Server Error');
            }
            console.log('Movie data saved to file:', filePath);
            res.send('Movie added successfully!');
        });
    });
};

// Function to generate markdown content from movie data
const generateMarkdownContent = (movieData) => {
    let content = '---\n'; // Start YAML front matter
    Object.keys(movieData).forEach(key => {
        if (Array.isArray(movieData[key])) {
            content += `${key}:\n`; // Start array field
            movieData[key].forEach(item => {
                content += `  - ${item}\n`; // Add each item in array
            });
        } else {
            content += `${key}: ${movieData[key]}\n`; // Add key-value pair
        }
    });
    content += '---\n'; // End YAML front matter
    return content;
};


// Controller function to print all file names in a directory
const printAllFileNames = (directoryPath, res) => {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            res.status(500).send('Error reading directory');
            return;
        }
        console.log('Files in directory:', directoryPath);
        const fileNames = files.map(file => path.basename(file));
        res.send(fileNames);
    });
};

const deleteFile = (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(process.env.FILE_UPLOAD_PATH, fileName);

    // Read the file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading file.');
        }

        // Split the data by newlines
        const lines = data.split('\n');
        
        // Extract image and banner paths
        let imagePath, bannerPath;
        lines.forEach(line => {
            if (line.startsWith('image:')) {
                imagePath = line.split('image: ')[1].trim();
            } else if (line.startsWith('banner:')) {
                bannerPath = line.split('banner: ')[1].trim();
            }
        });

        if (!imagePath || !bannerPath) {
            return res.status(500).send('Image or banner path not found in file.');
        }

        // Construct full paths
        const fullImagePath = path.join(process.env.IMAGE_UPLOAD_PATH, imagePath);
        const fullBannerPath = path.join(process.env.IMAGE_UPLOAD_PATH, bannerPath);

        // Delete image and banner files
        fs.unlink(fullImagePath, (err) => {
            if (err) {
                console.error('Error deleting image:', err);
                return res.status(500).send('Error deleting image.');
            }
            console.log('Image Deleted Successfully');
        });

        fs.unlink(fullBannerPath, (err) => {
            if (err) {
                console.error('Error deleting banner:', err);
                return res.status(500).send('Error deleting banner.');
            }
            console.log('Banner Deleted Successfully');
        });

        // Delete the file itself
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).send('Error deleting file.');
            }

            res.send('File and associated images deleted successfully.');
        });
    });
};

const readFile = (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(process.env.FILE_UPLOAD_PATH, fileName);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading file');
        }

        try {
            // Split the data into individual documents
            const documents = data.split('---').filter(doc => doc.trim());
            
            // Parse each document into JavaScript objects
            const parsedData = documents.map(doc => YAML.load(doc));
            
            res.json(parsedData); // Return parsed data in JSON format
        } catch (error) {
            console.error('Error parsing YAML:', error);
            return res.status(500).send('Error parsing YAML');
        }
    });
};
const editMovie = (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(process.env.FILE_UPLOAD_PATH, fileName);

    // Read the existing file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading file');
        }

        try {
            console.log(req.body)
            // Parse YAML data
            let movie = YAML.load(data);
            console.log(movie)
            // Check if image URLs have changed
            if (req.body.image !== movie.image || req.body.banner !== movie.banner) {
                // Delete previous images
                deleteImages(req.body.image, req.body.banner);
            }

            // Update movie data with new values
          
            movie.title = req.body.title;
            movie.description = req.body.description;
            movie.date = req.body.date;
            movie.image = req.body.image;
            movie.banner = req.body.banner;
            movie.categories = req.body.categories;
            movie.author = req.body.author;
            movie.tags = req.body.tags.split(',').map(tag => tag.trim());
            movie.rating = req.body.rating;
            movie.draft = req.body.draft === 'on';
            movie.year = req.body.year;

            // Convert updated data back to YAML format
            const updatedData = YAML.dump(movie);

            // Write the updated YAML data to the file
            fs.writeFile(filePath, updatedData, 'utf8', (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return res.status(500).send('Error writing file');
                }
                res.send('File updated successfully');
            });
        } catch (error) {
            console.error('Error parsing YAML:', error);
            return res.status(500).send('Error parsing YAML');
        }
    });
};
const deleteImages = (imagePath, bannerPath) => {
    // Delete image file
    fs.unlink(imagePath, (err) => {
        if (err) {
            console.error('Error deleting image:', err);
        } else {
            console.log('Image deleted successfully:', imagePath);
        }
    });

    // Delete banner file
    fs.unlink(bannerPath, (err) => {
        if (err) {
            console.error('Error deleting banner:', err);
        } else {
            console.log('Banner deleted successfully:', bannerPath);
        }
    });
};
module.exports = { printAllFileNames , addMovie  , deleteFile , readFile , editMovie};

// module.exports = { addMovie };
