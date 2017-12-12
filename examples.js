const SeriesMeta = require('./index.js');
/*
SeriesMeta.isSeriesEnded('Smallville')
.then((data) => {
  if (data.ended == true) {
    console.log(`${data.series} has ended. The last episode was aired on ${data.date}.`)
  } else {
    console.log(`${data.series} is still being aired.`)
  }
  console.log(data)
})
.catch((error) => {
  console.log('The series you were looking for could not be found.')
});

SeriesMeta.whenIsNext('Star Trek Discovery')
.then((data) => {
  if (data.season != 0) {
    console.log(`The next episode of ${data.series} is going to air on ${data.date}.`)
  } else {
    console.log(`It is unknown when the next episode of ${data.series} is going to air.`);
  }
  console.log(data)
})
.catch((error) => {
  console.log('The series you were looking for could not be found.')
});

SeriesMeta.whenIsPrevious('Star Trek Discovery')
.then((data) => {
  if (data.season != 0) {
    console.log(`The previous episode of ${data.series} was aired on ${data.date}.`)
  } else {
    console.log(`It is unknown when the previous episode of ${data.series} was aired.`);
  }
  console.log(data)
})
.catch((error) => {
  console.log('The series you were looking for could not be found.')
});

SeriesMeta.whenIsPrevious('24')
.then((data) => {
  if (data.season != 0) {
    console.log(`The previous episode of ${data.series} was aired on ${data.date}.`)
  } else {
    console.log(`It is unknown when the previous episode of ${data.series} was aired.`);
  }
  console.log(data)
})
.catch((error) => {
  console.log('The series you were looking for could not be found.')
});

SeriesMeta.isEpisodeAired(1, 15, 'Star Trek Discovery')
.then((data) => {
  if (data.aired) {
    console.log(`Season ${data.season}, episode ${data.episode} of ${data.series} has been aired on ${data.date}.`)
  } else {
    if (data.season == 0) {
      console.log(`It is unknown if the episode you requested exists.`)
    } else {
      console.log(`Season ${data.season}, episode ${data.episode} of ${data.series} has not yet been aired. It will on ${data.date}.`);
    }
  }
  console.log(data)
})
.catch((error) => {
  console.log(error)
  console.log('The series you were looking for could not be found.')
});

SeriesMeta.hasNextEpisode(1, 14, 'Star Trek Discovery')
.then((data) => {
  console.log(data)
  if (data.date != '') {
    if (data.aired) {
      console.log(`Season ${data.season} episode ${data.episode} is the next episode. It was aired on ${data.date}.`)
    } else {
      console.log(`Season ${data.season} episode ${data.episode} is the next episode. It's going to air on ${data.date}.`)
    }
  } else {
    if (data.ended) {
      console.log(`There won't be a next episode, the series has ended.`)
    } else {
      console.log(`Season ${data.season} episode ${data.episode} is the last known episode at this time.`)
    }
  }
})
.catch((error) => {
  console.log(error)
  console.log('The series you were looking for could not be found.')
});

SeriesMeta.hasPreviousEpisode(1, 1, 'Star Trek Discovery')
.then((data) => {
  console.log(data)
  if (data.date != '') {
    if (data.aired) {
      console.log(`Season ${data.season} episode ${data.episode} is the previous episode. It was aired on ${data.date}.`)
    } else {
      console.log(`Season ${data.season} episode ${data.episode} is the previous episode. It's going to air on ${data.date}.`)
    }
  } else {
    if (data.ended) {
      console.log(`There won't be a next episode, the series has ended.`)
    } else {
      console.log(`Season ${data.season} episode ${data.episode} is the first known episode.`)
    }
  }
})
.catch((error) => {
  console.log(error)
  console.log('The series you were looking for could not be found.')
});

SeriesMeta.currentEpisode('Agents of S.H.I.E.L.D.')
.then((data) => {
  console.log(data)
})
.catch((error) => {
  console.log(error)
  console.log('The series you were looking for could not be found.')
});

SeriesMeta.whenPremiered('Black Lightning')
.then((data) => {
  console.log(data)
})
.catch((error) => {
  console.log(error)
  console.log('The series you were looking for could not be found.')
});

SeriesMeta.episodesByDate('Agents of S.H.I.E.L.D.', '2017-12-01')
.then((data) => {
  console.log(data)
})
.catch((error) => {
  console.log(error)
  console.log('The series you were looking for could not be found.')
});

SeriesMeta.metadata('Agents of S.H.I.E.L.D.')
.then((data) => {
  console.log(data)
})
.catch((error) => {
  console.log(error)
  console.log('The series you were looking for could not be found.')
});
*/

// Example of getting the episodes for today and the metadata with it.
// With Promises:

let series = 'Agents of S.H.I.E.L.D.';

// Note: this works, but has a downside of calling the backend API twice if it wasn't in the cache yet.
// It works, but isn't as ideal as it could be.
/*
Promise.all([SeriesMeta.episodesByDate(series, '2017-12-01'), SeriesMeta.metadata(series)])
.then((values) => {
  console.log(values[0])
  console.log(values[1])
})
.catch((error) => {
  console.log(error)
});
*/

// This version works with calling the backend API just once if it wasn't in the cache yet. The sebsequent call comes from the cache.
// The await keyword is the key here. It first gets the episodes (and waits for the response) then the metadata (and waits).
/*
(async () => {
  let episodes = await SeriesMeta.episodesByDate(series, '2017-12-01')
  let meta = await SeriesMeta.metadata(series)
  return [episodes, meta];
})(series)
.then(values => {
  console.log(values);  // prints 60 after 2 seconds.
});


SeriesMeta.currentEpisode('Lucifer')
.then((data) => {
  console.log(data)
})
.catch((error) => {
  console.log(error)
  console.log('The series you were looking for could not be found.')
});
*/

// Or another example where an api wrapper function is made. The first argument would be the API call.
// The second argument the series name which would internally be passed to the metadata function.
// That way you only need to provide a very little to get the api output you want + the metadata.
let ApiWrapper = async (apiFunctionData, series) => {
  let one = await apiFunctionData;
  let two = await SeriesMeta.metadata(series);
  return [one, two];
};

ApiWrapper(SeriesMeta.currentEpisode(series), series)
.then((values) => {
  console.log(values)
})
.catch((error) => {
  console.log(error)
});
