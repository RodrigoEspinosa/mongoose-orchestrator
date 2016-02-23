import { expect } from 'chai';
import { Show, Season, Episode } from './models';


/**
 * Describe tests for when the document changes and the values
 * required to be synchronized should update as well.
 */
describe('When updating self schema', function() {

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

  it('should update using references in nested documents', function(done) {
    // Create a new show.
    const show = new Show({name: 'Testing Show', seasons: 4});

    // Create a new season.
    const season = new Season({name: 'Testing season with Show', 'show.id': show._id});

    show.save()
      .then(season.save)
      .then((season) => {
        expect(season.show.title).to.equal('Testing Show');
        expect(season.show.amountOfSeasons).to.equal(4);
        done();
      })
      .catch(done);
  });

});
