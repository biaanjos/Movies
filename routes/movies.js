const express = require("express");
const router = express.Router();
// Import Express validatior
const { check, validationResult } = require("express-validator");
const movie = require("../models/movie");
let Movie = require("../models/movie");
let User = require("../models/user");

// Genres
let genres = [
  "action",
  "comedy",
  "crime",
  "drama",
  "fantasy",
  "horror",
  "romance",
  "thriller",
];

// Attach routes to router
router
  .route("/add")
  .get(ensureAuthenticated, (req, res) => {
    // Render page with list of genres
    res.render("add_movie", {
      genres: genres,
    });
  })
  .post(ensureAuthenticated, async (req, res) => {
    // Async validation check of form elements
    await check("name", "Name is required").notEmpty().run(req);
    await check("description", "Description is required").notEmpty().run(req);
    await check("year", "Year is required").notEmpty().run(req);
    await check("rating", "Rating is required").notEmpty().run(req);
    await check("genres", "Genre is required").notEmpty().run(req);

    // Get validation errors
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      let movie = new Movie();
      // Assign attributes based on form data
      movie.name = req.body.name;
      movie.description = req.body.description;
      movie.year = req.body.year;
      movie.genres = req.body.genres;
      movie.rating = req.body.rating;
      movie.posted_by = req.user.id;

      movie.save(function (err) {
        if (err) {
          // Log error if failed
          console.log(err);
          return;
        } else {
          res.redirect("/");
        }
      });
    } else {
      res.render("add_movie", {
        // Render form with errors
        errors: errors.array(),
        genres: genres,
      });
    }
  });


router
  .route("/:id")
  .get((req, res) => {
    Movie.findById(req.params.id, function (err, movie) {
      User.findById(movie.posted_by, function (err, user) {
        if (err) {
          console.log(err);
        }
        res.render("movie", {
          movie: movie,
          posted_by: user.name,
        });
      });
    });
  })
  .delete((req, res) => {
    // Restrict delete if user not logged in
    if (!req.user._id) {
      res.status(500).send();
    }

    // Create query dict
    let query = { _id: req.params.id };

    Movie.findById(req.params.id, function (err, movie) {
      if (movie.posted_by != req.user._id) {
        res.status(500).send();
      } else {
        Movie.deleteOne(query, function (err) {
          if (err) {
            console.log(err);
          }
          res.send("Successfully Deleted");
        });
      }
    });
  });

router
  .route("/edit/:id")
  .get(ensureAuthenticated, (req, res) => {
    Movie.findById(req.params.id, function (err, movie) {
      if (movie.posted_by != req.user._id) {
        res.redirect("/");
      }
      res.render("edit_movie", {
        movie: movie,
        genres: genres,
      });
    });
  })
  .post(ensureAuthenticated, (req, res) => {
    let movie = {};

    // Assign attributes based on form data
    movie.name = req.body.name;
    movie.description = req.body.description;
    movie.year = req.body.year;
    movie.genres = req.body.genres;
    movie.rating = req.body.rating;

    let query = { _id: req.params.id };

    Movie.findById(req.params.id, function (err, movie_db) {
      // Restrict to only allowing user that posted to make updates
      if (movie_db.posted_by != req.user._id) {
        res.redirect("/");
      } else {
        Movie.updateOne(query, movie, function (err) {
          if (err) {
            console.log(err);
            return;
          } else {
            res.redirect("/");
          }
        });
      }
    });
  });

// Function to protect routes from unauthenticated users
function ensureAuthenticated(req, res, next) {
  // If logged in proceed to next middleware
  if (req.isAuthenticated()) {
    return next();
    // Otherwise redirect to login page
  } else {
    res.redirect("/users/login");
  }
}

module.exports = router;
