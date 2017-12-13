# SeriesMeta
## About
[![npm version](https://badge.fury.io/js/seriesmeta.svg)](https://badge.fury.io/js/seriesmeta)  
[![NPM](https://nodei.co/npm/seriesmeta.png)](https://nodei.co/npm/seriesmeta/)

This package is written with home automation systems in mind. While this module won't allow you to speak to, it will allow you to integrate series data. For instance, if you make a Google Assistant module to get the current series running state you would asl something like: "Is the [series] still running?" where you would implement the response by calling the 'isSeriesEnded([series])' API method. That would return an object indicating if it's ended which gives you room to construct a scentence for you TTS engine to speak.

The module is using the awesome **TVMaze** API behind the scenes and asks all information about a series including the known episodes. That is quite a hefty request, thefore **SeriesMeta** is fully cached. Eash request you make lives in it's own cache for 1 week, series data doesn't change that often anyhow. So after your initial call, all subsequent calls on the same series are local, this also improves fetching performance quite massively as the number of webcalls is reduced to the bare minimum.

This module obviously isn't limited to speech focused tasks, it can be used with anything where you need series information.

## Functions

- [isEpisodeAired](#isepisodeaired)
- [isSeriesEnded](#isseriesended)
- [hasNextEpisode](#hasnextepisode)
- [hasPreviousEpisode](#haspreviousepisode)
- [currentEpisode](#currentepisode)
- [episodesByDate](#episodesbydate)
- [whenIsNext](#whenisnext)
- [whenIsPrevious](#whenisprevious)
- [whenPremiered](#whenpremiered)
- [metadata](#metadata)

## Return object
Each API call returns a promise.
When the promise fails, it returns a reason for why it failed. It might contain more information.
When the promise succeeds it will always return the following object:
```js
{
  episode: 0,
  season: 0,
  series: '',
  date: '',
  ended: false,
  aired: false
}
``` 

Note that depending on the API call, it will be just this object or an array with 1 or more of these objects in them.
I am referring to this in the documentation below as the `episodeObject`.

---
## isEpisodeAired

Returns 1 `episodeObject` with the data of the requested episode.  
The parameters:
- season : The season (a number) you're looking for.
- episode : The episode (a number) within the season.
- series : The series (a string).

Example:
```js
let data = await isEpisodeAired('Lucifer', 1, 10);
```

## isSeriesEnded

Returns 1 `episodeObject` with the last known episode of the requested series.  
The parameters:
- series : The series (a string).

Example:
```js
let data = await isSeriesEnded('Lucifer');
```

## hasNextEpisode

Returns 1 `episodeObject` with the **next** episode based on the episode you provided. This could also be the first episode in the next season.  
The parameters:
- season : The season (a number) you're looking for.
- episode : The episode (a number) within the season.
- series : The series (a string).

Example:
```js
let data = await hasNextEpisode('Lucifer', 1, 10);
```

## hasPreviousEpisode

Returns 1 `episodeObject` with the **previous** episode based on the episode you provided. This could also be the last episode of  the previous season.  
The parameters:
- season : The season (a number) you're looking for.
- episode : The episode (a number) within the season.
- series : The series (a string).

Example:
```js
let data = await hasPreviousEpisode('Lucifer', 1, 10);
```

## currentEpisode

Returns an array of `episodeObject`. Current should be interpreted as "has an episode been aired in the last few days?". There could very well be more than 1 episode in the return array. For instance, by default it looks at the past 3 days and returns all episodes aired in that timeframe. You could fine tune this to be broader or narrower, whatever you find fitting for "current".
The parameters:
- series : The series (a string).
- (optional) lookbackDays: A number of days to look back. The number is today - number.

Example:
```js
let data = await currentEpisode('Lucifer');
```

## episodesByDate

Returns an array of `episodeObject` based on a given date. By default the date is today, but you can set it. For this it's also possible to have multiple episodes air on the same date hence the return of an array.
The parameters:
- series : The series (a string).
- (optional) date: A string in YYYY-MM-DD format, default to today.

Example:
```js
let data = await episodesByDate('Lucifer');
```

## whenIsNext

Returns an array of `episodeObject` based internally based on the current date (not settable). It tries to find the **first** date when the next episode that airs **on** or **after** the current date and returns those. If that date happens to have multiple episodes being aired then those will all be returned.
The parameters:
- series : The series (a string).

Example:
```js
let data = await whenIsNext('Lucifer');
```

## whenIsPrevious

Returns an array of `episodeObject` based internally based on the current date (not settable). It tries to find the **first** date when the next episode that airs **on** or **before** the current date and returns those. If that date happens to have multiple episodes being aired then those will all be returned.
The parameters:
- series : The series (a string).

Example:
```js
let data = await whenIsPrevious('Lucifer');
```

## whenPremiered

Returns 1 `episodeObject` with the first episode apisode. Note that this first episode is just the series first episode which it always returns. Regardless if th episode has aired or not. The return data object does contain an `aired` values though which is set to true (when aired) or false (when it hasn't aired yet).  
The parameters:
- series : The series (a string).

Example:
```js
let data = await whenPremiered('Lucifer');
```

## metadata

This is a bit of an extra function that ruturns the following object:
```js
{
  // Series name, usually the same you provide.
  name,
  
  // An array of images urls from the TVMaze API.
  images,
  
  // The series description.
  summary,
  
  // The tt0000000 iMDB ID for the series.
  imdb
}
```

The values are pretty self explenatory. The `images` value is an array of images as the come from the **TVMaze** API.

The parameters:
- series : The series (a string).

Example:
```js
let data = await metadata('Lucifer');
```


