const express = require('express');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

const mongoose = require('mongoose');

// connect to the database
mongoose.connect('mongodb://172.17.0.1:27017/museum', {
  useNewUrlParser: true
});

const multer = require('multer')
const upload = multer({
  dest: '/etc/data/front-end/dist/images/',
  limits: {
    fileSize: 10000000
  }
});

const itemSchema = new mongoose.Schema({
  title: String,
  description: String,
  path: String,
});

// Create a model for items in the museum.
const Item = mongoose.model('Item', itemSchema);

const fs = require('fs')

// Upload a photo. Uses the multer middleware for the upload and then returns
// the path where the photo is stored in the file system.
app.post('/api/photos', upload.single('photo'), async (req, res) => {
  // Just a safety check
  if (!req.file) {
    return res.sendStatus(400);
  }
  res.send({
    path: "/images/" + req.file.filename
  });
});

// Create a new item in the museum: takes a title and a path to an image.
app.post('/api/items', async (req, res) => {
  const item = new Item({
    title: req.body.title,
    description: req.body.description,
    path: req.body.path,
  });
  try {
    await item.save();
    res.send(item);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

// Get a list of all of the items in the museum.
app.get('/api/items', async (req, res) => {
  try {
    let items = await Item.find();
    res.send(items);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    let item = await Item.findOne({
      _id: req.params.id
    });
    await Item.deleteOne(item);
    const path = '/var/www/museum.jmbastian.com' + item.path
    fs.unlink(path, (err) => {
      if (err) {
        console.error(err)
        return
      }
    })
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    let item = await Item.findOne({
      _id: req.params.id
    });
    item.title = req.body.title;
    item.description = req.body.description;
    
    await item.save();
    res.send(item);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.use(express.static('../front-end/dist/'));
app.listen(3000, () => console.log('Server listening on port 3000!'));
