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

function curlReq(url, extraOptions = {}) {
  return new Promise((resolve, reject) => {
    let options = {
      url: url,
      useragent: 'SeriesMeta',
      compressed: true,
      insecure: true,
      timeout: 5,
      retries: 3
    };

    Object.assign(options, extraOptions)

    curl.request(options, function (err, data, meta) {
      if (err || data == '') {
        reject({error: "No valid information found in api service. Url used: " + url})
      } else {
        resolve(JSON.parse(data));
      }
      reject("Unable to contact API. Url used:" + url);
    });
  });
}

// Promisified the cache.get function. If it were promise based, this function could go.
function getCacheValue(key) {
  return new Promise((resolve, reject) => {
    cache.get(key, (error, value) => {
      if (!error) {
        resolve(value);
      } else {
        reject(error)
      }
    })
  });
}

async function getSeries(series) {
  let seriesLower = series.toLowerCase().replace('&', 'and')
  let data = await getCacheValue(seriesLower);
  let matchResult = seriesLower.match(/^(t{2}\d{7})$/ig);
  let fromImdbID = matchResult?.[0];

  if (!data) {
    if (fromImdbID) {
      try {
        // Get the IMDB ID data. This is 2 API calls. The URL itself is a redirect (which curl follows).
        dataForId = await curlReq(`https://api.tvmaze.com/lookup/shows?imdb=${seriesLower}`);
        
        // Get the actual data we were looking for (3rd API call)
        data = await curlReq(`https://api.tvmaze.com/shows/${dataForId.id}?embed=episodes`);
      } catch (error) {
        return Promise.reject(`Failed to get data by IMDB ID for: ${seriesLower}`)
      }
    } else {
      data = await curlReq(`https://api.tvmaze.com/singlesearch/shows?q=${seriesLower}&embed=episodes`);
    }

    // Cache the data itself
    cache.set(data.name.toLowerCase(), data, 604800); // The number is 1 week in seconds.
    
    // We add a second value, this is with the IMDB ID. It merely stores the name by which to find the actual data.
    cache.set(data.externals.imdb.toLowerCase(), { redirect: true, series: data.name.toLowerCase()}, 604800); // The number is 1 week in seconds.
  } else if (fromImdbID && 'redirect' in data) {
    data = await getCacheValue(data.series);
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

  isEpisodeAired: async (season, episode, series) => {
    try {
      let data = await getSeries(series)
      let obj = newReturnObject(0, 0, series);
      let episodes = data._embedded.episodes;

      // We know for sure that the series contains the requested episode. But did it air?
      for (let epi of episodes) {
        if (epi.season == season && epi.number == episode) {
          obj = fillReturnObject(series, epi, data);
          break;
        }
      }

      return Promise.resolve(obj);
    } catch (error) {
      return Promise.reject(error)
    }
  },

  isSeriesEnded: async (series) => {
    try {
      let data = await getSeries(series)
      let episodes = data._embedded.episodes;
      let lastEpisode = episodes[episodes.length - 1]
      let obj = fillReturnObject(series, lastEpisode, data);

      return Promise.resolve(obj);
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // Tries to figure out if there is a new episode after the one you provided.
  hasNextEpisode: async (season, episode, series) => {
    try {
      let data = await getSeries(series)
      let obj = [];
      let episodes = data._embedded.episodes;

      let index = episodes.findIndex((epi) => {
        return epi.season == season && epi.number == episode;
      });

      // If it's still false of if the season isn't set, set some backup values.
      if ((index + 1) > episodes.length || index < 0) {
        obj = fillReturnObject(series, null, data);
        obj.season = season;
        obj.episode = episode;
      } else {
        obj = fillReturnObject(series, episodes[index + 1], data);
      }

      return Promise.resolve(obj);
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // Tries to figure out if there is a previous episode before the one you provided
  hasPreviousEpisode: async (season, episode, series) => {
    try {
      let data = await getSeries(series)
      let obj = [];
      let episodes = data._embedded.episodes;

      let index = episodes.findIndex((epi) => {
        return epi.season == season && epi.number == episode;
      });

      // If it's still false of if the season isn't set, set some backup values.
      if ((index - 1) < 0) {
        obj = fillReturnObject(series, null, data);
        obj.season = season;
        obj.episode = episode;
      } else {
        obj = fillReturnObject(series, episodes[index - 1], data);
      }

      return Promise.resolve(obj);
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // This searches for the latest day that an episode aired and returns all episodes from that day.
  // Usually that's 1 episode, but sometimes multiple episodes are aired on one day. The return will
  // then have multiple episodes in ascending order sorted by date.
  latestEpisode: async (series) => {
    try {
      let data = await getSeries(series)
      let episodes = data._embedded.episodes.reverse();

      let index = episodes.findIndex((epi) => {
        return Moment(epi.datetime) <= Moment();
      });

      if (index < 0) {
        return Promise.resolve(fillReturnObject(series, 0, data));
      } else {
        let obj = await module.exports.episodesByDate(series, Moment(episodes[index].datetime).format('YYYY-MM-DD'))
        return Promise.resolve(obj.reverse())
      }
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // This is comparable to "latestEpisode" but with a bigger date margin. An episode is considered the "latest"
  // if it was aired within the number of days defined in lookbackDays (3 by default). The difference here is that
  // currentEpisode will not return any if it's not within the lookback days. latestEpisode will always return the latest aired one.
  currentEpisode: async (series, lookbackDays = 3) => {
    try {
      let data = await getSeries(series);
      let allEpisodes = await module.exports.allEpisodes(series)
      let end = Moment();
      let start = Moment().subtract(lookbackDays, 'days');

      let obj = allEpisodes.filter(item => {
        let date = new Date(item.datetime);
        return date >= start && date <= end;
      }).map(item => {
        return fillReturnObject(series, item, data)
      });
     
      return Promise.resolve(obj);
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // Returns the episode from the given date, defaults to 'today'.
  episodesByDate: async (series, date = Moment().format('YYYY-MM-DD')) => {
    try {
      let data = await getSeries(series)
      let episodes = data._embedded.episodes;

      let obj = episodes.filter(item => {
        return date == item.datetime.format('YYYY-MM-DD');
      }).map(item => {
        return fillReturnObject(series, item, data)
      });

      return Promise.resolve(obj);
    } catch (error) {
      return Promise.reject(error)
    }
  },

  whenIsNext: async (series) => {
    try {
      let data = await getSeries(series)
      let episodes = data._embedded.episodes;

      let index = episodes.findIndex((epi) => {
        return Moment(epi.datetime) >= Moment();
      });

      if (index < 0) {
        return Promise.resolve(fillReturnObject(series, 0, data));
      } else {
        let obj = await module.exports.episodesByDate(series, Moment(episodes[index].datetime).format('YYYY-MM-DD'))
        return Promise.resolve(obj.reverse())
      }
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // Same as lastEpisode. The logic for that is simpler then this was and the name is more intuitive.
  whenIsPrevious: async (series) => {
    return module.exports.latestEpisode(series);
  },

  whenPremiered: async (series) => {
    try {
      let data = await getSeries(series)
      let firstEpisode = data._embedded.episodes[0];
      return Promise.resolve(fillReturnObject(series, firstEpisode, data));
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // This returns an object containing metadata about the current series.
  metadata: async (series) => {
    try {
      let data = await getSeries(series)
      let meta = {
        name: data.name,
        images: data.image,
        summary: data.summary,
        imdb: data.externals.imdb
      }
      return Promise.resolve(meta);
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // This return an array containing all the episodes metadata
  allEpisodes: async (series) => {
    try {
      let data = await getSeries(series);
      let episodes = data._embedded.episodes;
      return Promise.resolve(episodes);
    } catch (error) {
      return Promise.reject(error)
    }
  }
};
