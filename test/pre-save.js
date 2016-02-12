import { expect } from 'chai';
import { Season, Episode } from './models';

describe('Pre-save', function() {

  const testData = {
    season: null
  };

  before(function(done) {
    // Create a sample season.
    testData.season = new Season({name: 'Testing Season'});
    testData.season.save(done);
  });

  it('should not have one attribute synchronized before saving', function() {

    // Create an episode without saving it.
    const episode = new Episode({
      name: 'Testing Episode',
      season: testData.season.id
    });

    expect(episode.seasonName).to.be.undefined;
  });


  it('should have one attribute syncronized', function() {

    // Create an episode and save it.
    const episode = new Episode({
      name: 'Testing Episode',
      season: testData.season.id
    }).save((err, episode) => {

      // The `seasonName` should be populated.
      expect(err).to.not.exist;
      expect(episode.seasonName).to.equal('Testing Season');
    });
  });

  it('should not sync a `sync: false` field', function() {

    // Create an episode and save it.
    const episode = new Episode({
      name: 'Testing Episode',
      season: testData.season.id
    }).save((err, episode) => {

      // The `seasonEpisodes` should not be populated.
      expect(err).to.not.exist;
      expect(episode.seasonEpisodes).to.be.undefined;
    });
  });

});
