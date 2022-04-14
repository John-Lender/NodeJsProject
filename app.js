const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');
const path = require('path');
const urlencodedParse = express.urlencoded({ extended: false })

var database = require('./config/database');
var Restaurants = require('./models/restaurants');
var app = express();
var db = mongoose.connection;
var bodyParser = require('body-parser'); // pull information from HTML POST (express4)

const port = process.env.port || 8000;
const exphbs = require('express-handlebars');
const { resolve } = require('path');
const HBS = exphbs.create({
    helpers: {},
    layoutsDir: path.join(__dirname, "views/layouts"),
    extname: "hbs",
    defaultLayout: "main"
});
app.engine('.hbs', HBS.engine)
app.set('view engine', '.hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ 'extended': 'true' })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

var restaurant = new Restaurants({
    address: {
        building: "2206",
        coord: [-74.1377286, 40.6119572],
        street: "Victory Boulevard",
        zipcode: 10314
    },
    borough: "Olesia Mashkovtseva",
    cuisine: "Jewish/Kosher",
    grades: [{
        date: "2014-10-06T00:00:00.000+00:00",
        grade: "A",
        score: 9
    }],
    name: "Kosher Island",
    restaurant_id: "40356442",
});

function initialize(connectedStr) {
    mongoose.connect(database.url, function(err) {
        if (err == null) console.info(connectedStr);
        else {
            console.error(err.message);
            process.exit();
        }
    });
}

function addNewRestaurant(data) {
    return data.save()
}

function getAllRestaurants(page, perPage, borough = {}) {
    return Restaurants
        .find(borough)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .sort({ restaurant_id: -1 })
        .lean()
}

function getRestaurantById(id) {
    return Restaurants
        .findById(id)
}

function updateRestaurantById(data, Id) {
    return Restaurants
        .findByIdAndUpdate({ _id: Id }, data)
}

function deleteRestaurantById(Id) {
    return Restaurants
        .deleteOne({ _id: Id })
}

initialize("Connected successfully");

app.post("/api/restaurants", function(req, res) {
    if (!req.body) return res.status(400).render('./partials/error.hbs', { message: "400, Bad Request" })
    let address = {
        building: req.body.building,
        coord: [req.body.lat, req.body.lon],
        street: req.body.street,
        zipcode: req.body.zipcode
    }
    let borough = req.body.borough
    let cuisine = req.body.cuisine
    let grades = [{
        date: req.body.date,
        grade: req.body.grade,
        score: req.body.score
    }]
    let name = req.body.name
    let restaurant_id = req.body.restaurant_id

    var newRestaurant = new Restaurants({
        address: address,
        borough: borough,
        cuisine: cuisine,
        grades: grades,
        name: name,
        restaurant_id: restaurant_id
    });

    addNewRestaurant(newRestaurant)
        .then((restaurant) => {
            res
                .status(201)
                .send("Success");
        })
        .catch(err => res.status(500).render('./partials/error.hbs', { message: "500, " + err.message }));
})

app.get("/api/restaurants", function(req, res) {
    if (req.query.page == undefined || req.query.perPage == undefined) {
        return res.status(400).render('./partials/error.hbs', { message: "400, Bad Request" })
    }
    let page = req.query.page;
    let perPage = req.query.perPage;
    let borough = {}
    if (req.query.borough != undefined) {
        borough = { borough: req.query.borough }
    }
    getAllRestaurants(page, perPage, borough)
        .then((restaurants) => {
            let code = 200;
            if (restaurants.length == 0) code = 204;
            res
                .status(code)
                .render('./pages/restaurants.hbs', { restaurants: restaurants });
        })
        .catch(err => res.status(500).render('./partials/error.hbs', { message: "500, " + err.message }));
})

app.get("/getId", function(req, res) {
    getRestaurantById("5eb3d668b31de5d588f4292c")
        .then((restaurant) => {
            console.log(restaurant);
        })
        .catch((err) => {
            console.error(err.message);
        });
})

/////

app.get("/updateById", function(req, res) {
    updateRestaurantById({ borough: "Olesia" }, "5eb3d668b31de5d588f4292c")
        .then((restaurant) => { console.log(restaurant); })
        .catch((err) => { console.error(err.message); });
})

app.get("/deleteById", function(req, res) {
    deleteRestaurantById("5eb3d668b31de5d588f4292c")
        .then((restaurant) => { console.log("deleted"); })
        .catch((err) => { console.error(err); });
})

app.use('/', function(req, res) {
    res.render('./partials/index', { title: 'Express' });
});

app.get('*', function(req, res) {
    res.render('./partials/error.hbs', { title: 'Error', message: 'Wrong Route' });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})