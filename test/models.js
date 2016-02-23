const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mongoose_orchestrator_testing');

const ObjectId = mongoose.Schema.Types.ObjectId;
import mongooseOrchestrator from '../src/index';


const ShowSchema = new mongoose.Schema({
  name: {type: String, required: true},

  seasons: {type: Number, default: 1}

});

const Show = mongoose.model('Show', ShowSchema);


// Create and register the `Season` model.

const SeasonSchema = new mongoose.Schema({

  name: {type: String, required: true},
  episodes: {type: Number, required: false},

  show: {
    id: {
      type: ObjectId,
      ref: 'Show'
    },
    title: {
      type: String,
      ref: 'Show.name',
      sync: true,
      source: 'show.id'
    },
    amountOfSeasons: {
      type: Number,
      ref: 'Show.seasons',
      sync: true,
      source: 'show.id'
    }
  }

});

SeasonSchema.plugin(mongooseOrchestrator);

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

export { Show, Season, Episode };
