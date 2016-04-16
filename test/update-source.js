import { expect } from 'chai';
import { User, Show, Season, Episode } from './models';


/**
 * Describe tests for when the source of the attributes referenced
 * somewhere else changes.
 */
describe('When updating the source', function() {

  const testData = {
    show: null,
    season: null,
    episode: null
  };

  before(function(done) {
    // Create a sample show.
    testData.show = new Show({
      name: 'Testing Show',
      episodes: 4
    });

    // Create a sample season.
    testData.season = new Season({
      name: 'Testing Season',
      show: {
        id: testData.show._id
      }
    });

    // Create a sample episode.
    testData.episode = new Episode({
      name: 'Testing Episode',
      season: testData.season
    });

    // Save the show, season and episode.
    testData.show.save()
      .then(testData.season.save)
      .then(testData.episode.save)
      .then(() => done())
      .catch((err) => expect(err).to.not.exist);
  });

  it('should update the episode if the season name changes', function(done) {
    testData.season.name = 'Testing Season CHANGED';

    testData.season.save((err, season) => {
      expect(err).to.not.exist;

      Episode.findById(testData.episode.id, (err, episode) => {
        expect(err).to.not.exist;
        expect(episode.seasonName).to.equal('Testing Season CHANGED');

        done();
      });
    });
  });

  it('should update the value on every referenced document', function(done) {
    // Create a season.
    let season = new Season({name: 'Season 2'});

    // Create an array of episode for this season.
    const episodes = [1, 2, 3, 4].map((num) => {
      return new Episode({season: season._id, name: `Episode ${num}`});
    });

    // Save all episodes so they get the initial Season name.
    const saveEpisodes = () => Promise.all(episodes.map(episode => episode.save()));

    const checkEpisodesSeasonNames = (seasonName) => {
      return function() {
        return new Promise(function(resolve, reject) {
          Episode.find({season: season._id}).exec()
            .then((episodes) => {
              for (let episode of episodes) {
                expect(episode.seasonName).to.equal(seasonName);
              }

              return resolve();
            })
            .catch(reject);
        });
      }
    }

    season.save()
      .then(saveEpisodes)
      .then(checkEpisodesSeasonNames('Season 2'))
      .then(() => {
        // Change and save the season name.
        season.name = 'Season 2 - CHANGED';
        return season.save();
      })
      .then(checkEpisodesSeasonNames('Season 2 - CHANGED'))
      .then(done)
      .catch(console.error);
  });

  it('should run transformations', function(done) {
    // Create a new user.
    const user = new User({name: 'Rodrigo'});

    // Create a new show associated with that user.
    const show = new Show({created_by: user._id, name: 'Testing Show'});

    user.save()
      .then(show.save)
      .then(() => {
        // Change the user name.
        user.name = 'Superman';
        return user.save();
      })
      .then(() => Show.findById(show._id))
      .then((show) => {
        expect(show.created_by_initial).to.equal('S');
        done();
      })
      .catch(done);
  });

});
