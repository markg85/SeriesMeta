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
*/

SeriesMeta.episodesByDate('Agents of S.H.I.E.L.D.', '2017-12-01')
.then((data) => {
  console.log(data)
})
.catch((error) => {
  console.log(error)
  console.log('The series you were looking for could not be found.')
});
