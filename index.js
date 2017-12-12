const curl = require('curlrequest');
const CachemanFile = require('cacheman-file');


let cacheOptions = {};
cacheOptions.tmpDir = null

const cache = new CachemanFile(cacheOptions);

let returnObject = {
  episode: 0,
  season: 0,
  series: '',
  date: '',
  ended: false,
  aired: false
}

function newReturnObject(season = 0, episode = 0, series = '') {
  let obj =  Object.create(returnObject);
  obj.season = season;
  obj.episode = episode;
  obj.series = series;
  return obj;
}

function queryApiService(series) {
  return new Promise((resolve, reject) => {
    let url = `https://api.tvmaze.com/singlesearch/shows?q=${series}&embed=episodes`
    let options = {
      url: url,
      useragent: 'SeriesMeta',
      insecure: true,
      timeout: 5,
      retries: 3
    };

    curl.request(options, function (err, data, meta) {
      if (err || data == '') {
        reject({error: "No valid information found in api service. Url used: " + url})
      } else {
        let parsedData = JSON.parse(data);
        cache.set(series, parsedData, 604800); // The number is 1 week in seconds.
        resolve(parsedData);
      }
      reject("Unable to contact API. Url used:" + url);
    });
  });
}

// Promisified the cache.get function. If it were promise based, this function could go.
function getCacheValue(key) {
  return new Promise((resolve, reject) => {
    cache.get(key, (error, value) => {
      resolve(value);
    })
  });
}

async function getSeries(series) {
  let dataFromCache = await getCacheValue(series);

  return new Promise((resolve, reject) => {
    if (dataFromCache != null) {
      resolve(dataFromCache);
    } else {
      resolve(queryApiService(series));
    }
  });
}

function fillReturnObject(series, episode, data) {
  let obj = newReturnObject(0, 0, series);
  
  if (episode) {
    obj.date = episode.airdate
    obj.season = episode.season
    obj.episode = episode.number

    let episodeAirDate = new Date(episode.airdate);
    obj.aired = (episodeAirDate <= new Date())
  }

  if (data.status == 'Ended') {
    obj.ended = true;
  }

  return obj;
}

module.exports = {
  
  isEpisodeAired: (season, episode, series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let obj = newReturnObject(0, 0, series);
        let episodes = data._embedded.episodes;
        let today = new Date();

        let lastKnownEpisode = episodes[episodes.length - 1];

        // We know for sure that the series contains the requested episode. But did it air?
        for (let epi of episodes) {
          if (epi.season == season && epi.number == episode) {
            obj = fillReturnObject(series, epi, data);
            break;
          }
        }

        resolve(obj);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },

  isSeriesEnded: (series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let episodes = data._embedded.episodes;
        let lastEpisode = episodes[episodes.length - 1]
        let obj = fillReturnObject(series, lastEpisode, data);

        resolve(obj);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },

  // Tries to figure out if there is a new episode after the one you provided.
  hasNextEpisode: (season, episode, series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let obj = newReturnObject(0, 0, series);
        let episodes = data._embedded.episodes;

        let wantNextOne = false;
        for (let epi of episodes) {
          if (wantNextOne) {
            // This is the one we're looking for!
            obj = fillReturnObject(series, epi, data);
            break;
          }

          if (epi.season == season && epi.number == episode) {
            wantNextOne = true;
          }
        }

        // If it's still false the season and episode are not set, set some backup values.
        if (!wantNextOne || obj.season == 0) {
          obj = fillReturnObject(series, null, data);
          obj.season = season;
          obj.episode = episode;
        }

        resolve(obj);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },

  // Tries to figure out if there is a previous episode before the one you provided
  hasPreviousEpisode: (season, episode, series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let obj = newReturnObject(0, 0, series);
        let episodes = data._embedded.episodes.reverse();

        let wantNextOne = false;
        for (let epi of episodes) {
          if (wantNextOne) {
            // This is the one we're looking for!
            obj = fillReturnObject(series, epi, data);
            break;
          }

          if (epi.season == season && epi.number == episode) {
            wantNextOne = true;
          }
        }

        // If it's still false of if the season isn't set, set some backup values.
        if (!wantNextOne || obj.season == 0) {
          obj = fillReturnObject(series, null, data);
          obj.season = season;
          obj.episode = episode;
        }

        resolve(obj);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },

  // This searches for episodes aired on or a few days before today.
  // Note that this could very likely return multiple episodes, the return is therefore always an array.
  // The second argument indicated how many days is still considered "current", the default is today - 3 days.
  currentEpisode: (series, lookbackDays = 3) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let obj = [] 
        let episodes = data._embedded.episodes.reverse();
        let till = new Date('2017-12-02');
        let from = new Date(till);
        from.setDate(from.getDate() - lookbackDays);

        for (let episode of episodes) {
          let episodeDate = new Date(episode.airdate)

          if (episodeDate <= till && episodeDate >= from) {
            obj.push(fillReturnObject(series, episode, data));
          }
        }

        resolve(obj);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },

  episodesByDate: (series, date) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let obj = [] 
        let episodes = data._embedded.episodes;
        let atDate = new Date(date);

        for (let episode of episodes) {
          let episodeDate = new Date(episode.airdate)

          if (date == episode.airdate) {
            obj.push(fillReturnObject(series, episode, data));
          }
        }

        resolve(obj);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },

  whenIsNext: (series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let obj = newReturnObject(0, 0, series);
        let episodes = data._embedded.episodes;
        let today = new Date();

        for (let episode of episodes) {
          let episodeDate = new Date(episode.airdate)

          if (episodeDate >= today) {
            obj = fillReturnObject(series, episode, data);
            break;
          }
        }

        // If nothing was found, use the last episode
        if (obj.season == 0) {
          obj = fillReturnObject(series, null, data);
        }

        resolve(obj);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },
  
  whenIsPrevious: (series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let obj = newReturnObject(0, 0, series);
        let episodes = data._embedded.episodes.reverse();
        let today = new Date();

        for (let episode of episodes) {
          let episodeDate = new Date(episode.airdate)

          if (episodeDate < today) {
            obj = fillReturnObject(series, episode, data);
            break;
          }
        }

        resolve(obj);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },

  whenPremiered: (series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let firstEpisode = data._embedded.episodes[0];
        resolve(fillReturnObject(series, firstEpisode, data));
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },

  // This returns an object containing metadata about the current series.
  metadata: (series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let meta = {
          name: data.name,
          images: data.image,
          summary: data.summary,
          imdb: data.externals.imdb
        }
        resolve(meta);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  }

};
