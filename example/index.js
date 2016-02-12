'use strict';

// Initialize the mongoose connection.

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose_orchestrator_example');


// Initialize the models.
require('./models');

const Season = mongoose.models.Season;
const Episode = mongoose.models.Episode;

// Create a new Season.
const season1 = new Season({
  name: "The Simpsons' eighth season"
});

season1.save((err) => {

  if (err) {
    console.error(err);
  }

  // Create a new episode for the existing season.
  const episode1 = new Episode({
    name: 'Treehouse of Horror VII',
    season: season1
  });

  episode1.save((err, episode) => {

    if (err) {
      console.error(err);
    }

    console.log(episode);

    process.exit(0);

  });
});
