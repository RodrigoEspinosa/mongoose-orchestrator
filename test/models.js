const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose_orchestrator_testing');

const ObjectId = mongoose.Schema.Types.ObjectId;
import mongooseOrchestrator from '../src/index';

// Create and register the `Season` model.

const SeasonSchema = new mongoose.Schema({

  name: {type: String, required: true},
  episodes: {type: Number, required: false}

});

const Season = mongoose.model('Season', SeasonSchema);


// Create and register the `Episode` model.

const EpisodeSchema = new mongoose.Schema({

  name: {type: String, required: true},

  season: {type: ObjectId, ref: 'Season'},
  seasonName: {type: String, ref: 'Season.name', sync: true},
  seasonEpisodes: {type: Number, ref: 'Season.episodes', sync: false}

});

EpisodeSchema.plugin(mongooseOrchestrator);

const Episode = mongoose.model('Episode', EpisodeSchema);

export { Season, Episode };
