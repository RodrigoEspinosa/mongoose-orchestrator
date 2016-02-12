'use strict';

const mongoose = require('mongoose');
const mongooseOrchestrator = require('../src/index');
const ObjectId = mongoose.Schema.Types.ObjectId;

// Create and register the `Season` model.

const SeasonSchema = new mongoose.Schema({

  name: {type: String, required: true},

  episodes: {type: Number, required: false}

});

mongoose.model('Season', SeasonSchema);


// Create and register the `Episode` model.

const EpisodeSchema = new mongoose.Schema({

  name: {type: String, required: true},

  season: {type: ObjectId, ref: 'Season'},
  seasonName: {type: String, ref: 'Season.name', sync: true},
  seasonEpisodes: {type: Number, ref: 'Season.episodes', sync: false}

});

EpisodeSchema.plugin(mongooseOrchestrator);

mongoose.model('Episode', EpisodeSchema);
