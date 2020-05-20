const curl = require('curlrequest');
const CachemanFile = require('cacheman-file');
const Moment = require('moment-timezone');

let cacheOptions = {};
cacheOptions.tmpDir = null

const cache = new CachemanFile(cacheOptions);

let returnObject = {
  episode: 0,
  season: 0,
  series: '',
  datetime: '',
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
      compressed: true,
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
  let data = await getCacheValue(series);

  if (!data) {
    data = await queryApiService(series);
  }

  return new Promise((resolve, reject) => {
    if (!data) {
      reject('Unable to get data.');
      return;
    }

    for (let episode of data._embedded.episodes) {
      episode.datetime = Moment(episode.airstamp).tz(module.exports.defaultTimezone);
    }

    data.image = module.exports.imageObjectHandler(data.image);

    resolve(data);
  });
}

function fillReturnObject(series, episode, data) {
  let obj = newReturnObject(0, 0, series);

  if (episode) {
    obj.season = episode.season
    obj.episode = episode.number
    obj.datetime = episode.datetime.toISOString(true)
    obj.aired = (episode.datetime.add(episode.runtime, 'minutes') <= Moment())
  }

  if (data.status == 'Ended') {
    obj.ended = true;
  }

  // Use data.name (series name) if the input name does not equal that.
  // This usually happens when a typo is made in a search query, data.name will return the most accurate name.
  if (series !== data.name) {
    obj.series = data.name
  }

  return obj;
}


module.exports = {

  // You must call "setDefaultTimezone to apply this, otherwise it's partly in local time and will mess up date calculations.
  defaultTimezone: "Europe/Amsterdam",

  // How to handle images within a response from TVMaze. By default we just take the images but replace http with https.
  // You get a key -> value object where the key is either 'medium' or 'original' and the value being the link to the image.
  // If you leave it as is then the urls will be replaced by https ones as that's the contect you likely use this script in.
  imageObjectHandler: (images) => {
    for (let obj in images) {
      images[obj] = images[obj].replace(/http:/i, "https:")
    }
    return images;
  },

  setDefaultTimezone: (timezone) => {
    module.exports.defaultTimezone = timezone
    Moment.tz.setDefault(timezone)
  },

  isEpisodeAired: (season, episode, series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let obj = newReturnObject(0, 0, series);
        let episodes = data._embedded.episodes;

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

  // This searches for the latest day that an episode aired and returns all episodes from that day.
  // Usually that's 1 episode, but sometimes multiple episodes are aired on one day. The return will
  // then have multiple episodes in ascending order sorted by date.
  latestEpisode: (series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let obj = [];
        let episodes = data._embedded.episodes.reverse();

        let previousEpisodeDate = null;
        let currentDate = Moment();

        for (let episode of episodes) {
          let episodeAirDate = episode.datetime;

          if (previousEpisodeDate == null && episodeAirDate <= currentDate) {
            previousEpisodeDate = episodeAirDate;
            obj.push(fillReturnObject(series, episode, data));
          } else if (episode.datetime == previousEpisodeDate) {
            obj.push(fillReturnObject(series, episode, data));
          }
        }

        resolve(obj.reverse());
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },

  // This uses the latestEpisode output but filtered by today - x days (x defaults to 3).
  // You can modify how many days x would be by adjusting the decons value.
  // Please do note that
  currentEpisode: (series, lookbackDays = 3) => {
    return new Promise((resolve, reject) => {
      module.exports.latestEpisode(series)
      .then((data) => {
        let obj = [];
        let till = Moment();
        let from = Moment().subtract(lookbackDays, 'days');

        for (let episode of data) {
          let episodeDate = Moment(episode.datetime)

          if (episodeDate <= till && episodeDate >= from) {
            obj.push(episode);
          }
        }

        resolve(obj);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  },

  // Returns the episode from the given date, defaults to 'today'.
  episodesByDate: (series, date = Moment().format('YYYY-MM-DD')) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let obj = [];
        let episodes = data._embedded.episodes;

        for (let episode of episodes) {
          if (date == episode.datetime.format('YYYY-MM-DD')) {
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
        let obj = [];
        let episodes = data._embedded.episodes;
        let today = Moment()

        // As long as we're looking for an episode (and have none), this is false.
        // If we find one, the next one must match the same date (indicating 2 (or more) episodes on the same date)
        let matchExactDate = false
        let exactDate = null

        for (let episode of episodes) {

          if (episode.datetime >= today && matchExactDate == false) {
            matchExactDate = true;
            exactDate = episode.datetime;
            obj.push(fillReturnObject(series, episode, data));
          } else if (matchExactDate == true && exactDate.format('YYYY-MM-DD') == episode.datetime.format('YYYY-MM-DD')) {
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

  // Same as lastEpisode. The logic for that is simpler then this was and the name is more intuitive.
  whenIsPrevious: (series) => {
    return module.exports.latestEpisode(series);
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
  },

  // This return an array containing all the episodes metadata
  allEpisodes: (series) => {
    return new Promise((resolve, reject) => {
      getSeries(series)
      .then((data) => {
        let episodes = data._embedded.episodes;
        resolve(episodes);
      })
      .catch((reason) => {
        reject(reason)
      });
    });
  }

};
