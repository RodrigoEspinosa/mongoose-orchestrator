const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;
const mongooseOrchestrator = require('../lib/index');

// Create and register the `Season` model.

const SeasonSchema = new mongoose.Schema({

  name: {type: String, required: true}

});

mongoose.model('Season', SeasonSchema);


// Create and register the `Episode` model.

const EpisodeSchema = new mongoose.Schema({

  name: {type: String, required: true},

  season: {type: ObjectId, ref: 'Season'},
  seasonName: {type: String, ref: 'Season.name', sync: true}

});

EpisodeSchema.plugin(mongooseOrchestrator);

mongoose.model('Episode', EpisodeSchema);
