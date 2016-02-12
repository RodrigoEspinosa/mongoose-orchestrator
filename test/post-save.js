import { expect } from 'chai';
import { Season, Episode } from './models';


describe('Post-save', function() {

  const testData = {
    season: null,
    episode: null
  };

  before(function(done) {
    // Create a sample season.
    testData.season = new Season({name: 'Testing Season'});

    // Create a sample episode.
    testData.episode = new Episode({
      name: 'Testing Episode',
      season: testData.season
    });

    // Save the season and episode.
    testData.season.save((err, season) => {
      expect(err).to.not.exist;

      testData.episode.save(done);
    });
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

});
