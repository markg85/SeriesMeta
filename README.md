# SeriesMeta
## About
[![npm version](https://badge.fury.io/js/seriesmeta.svg)](https://badge.fury.io/js/seriesmeta)  
[![NPM](https://nodei.co/npm/seriesmeta.png)](https://nodei.co/npm/seriesmeta/)

This package is written with home automation systems in mind. While this module won't allow you to speak to, it will allow you to integrate series data. For instance, if you make a Google Assistant module to get the current series running state you would asl something like: "Is the [series] still running?" where you would implement the response by calling the 'isSeriesEnded([series])' API method. That would return an object indicating if it's ended which gives you room to construct a scentence for you TTS engine to speak.

The module is using the awesome **TVMaze** API behind the scenes and asks all information about a series including the known episodes. That is quite a hefty request, thefore **SeriesMeta** is fully cached. Eash request you make lives in it's own cache for 1 week, series data doesn't change that often anyhow. So after your initial call, all subsequent calls on the same series are local, this also improves fetching performance quite massively as the number of webcalls is reduced to the bare minimum.

This module obviously isn't limited to speech focused tasks, it can be used with anything where you need series information.

## Functions

- [setDefaultTimezone](#setdefaulttimezone)
- [imageObjectHandler](#imageobjecthandler)
- [isEpisodeAired](#isepisodeaired)
- [isSeriesEnded](#isseriesended)
- [hasNextEpisode](#hasnextepisode)
- [hasPreviousEpisode](#haspreviousepisode)
- [currentEpisode](#currentepisode)
- [latestEpisode](#lastestepisode)
- [episodesByDate](#episodesbydate)
- [whenIsNext](#whenisnext)
- [whenIsPrevious](#whenisprevious)
- [whenPremiered](#whenpremiered)
- [metadata](#metadata)
- [allEpisodes](#allepisodes)

## New in 0.3.0
The `series` value in all of the functions can now be an IMDB ID as well. Note that this IMDB ID needs to be provided in this format: `tt1234567`.
The caching internally still caches series by their name. Additionally, it adds a "cache mapping" from the IMDB ID to that name. This guarantees that searching for a series by either the name or IMDB ID results in the cache entry for both to be created. Any subsequent call with either that same name or IMDB ID will then come from the cache.

## Return object
Each API call returns a promise.
When the promise fails, it returns a reason for why it failed. It might contain more information.
When the promise succeeds it will always return the following object:
```js
{
  episode: 0,
  season: 0,
  series: '',
  datetime: '', // As an ISO 8601 string
  ended: false,
  aired: false
}
```

Note that depending on the API call, it will be just this object or an array with 1 or more of these objects in them.
I am referring to this in the documentation below as the `episodeObject`.

---
## setDefaultTimezone

Sets the default timezone for conversions.
The parameters:
- timezone : The timezone (a string) like 'Europe/Amsterdam'

Example:
```js
setDefaultTimezone('Europe/Amsterdam')
```

## imageObjectHandler

Sets a function to be used as image object handler as it comes from TVMaze.
By default it behaves as before (aka, replaces http with https links), but this function allows more fine grained control over images.
For instance, you can now cache images locally and replace the url's to use your local cached ones.
The input you get is an object like:
```js
{
  original: 'http://some/url/to/an/image.ext',
  medium: 'http://some/url/to/an/image.ext',
}
```

You just need to return an array that, at the very least, contains the same keys (`original` and `medium`) with their valies being an url to an image.
For example, you can use this mechanism to download images, process them and return the processed images instead.

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

The implementation of this function changed 0.2.0. It now uses `latestEpisode` internally and basically applies a date range filter over the output.

Example:
```js
let data = await currentEpisode('Lucifer');
```

## latestEpisode

Returns an array of `episodeObject` of the latest aired episode of the given series.
If in that last aired day multiple episodes aired then it's returned in ascending order sorted by date. Thus the last element in the return array is always the lastest aired episode.

The parameters:
- series : The series (a string).

The difference between this function and currentEpisode is that this function will always return the last aired episode, however long ago it was.

Example:
```js
let data = await latestEpisode('Lucifer');
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

See `latestEpisode` as that does (in a simpler way) what this was doing.
Also, that function is more intuitive in name.
This function remains, but it merely an alias to `latestEpisode`.

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

This is a bit of an extra function that returns the following object:
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

The parameters:
- series : The series (a string).

Example:
```js
let data = await metadata('Lucifer');
```

## allEpisodes

This is a function that returns all the episodes of a serie as the following object in an array:
```js
{
  // Id of the episode.
  id,
  // Url of the episode 'http://www.tvmaze.com/episodes/{id}/{name}'.
  url,
  // Name of the episode.
  name,
  // N° of the season.
  season,
  // N° of the episode.
  number,
  // Air date
  airdate,
  // Hour of diffusion.
  airtime,
  // Date and time of the broadcast.
  airstamp,
  // Length of the episode
  runtime,
  // Link of an image
  image,
  // Summary of the episode
  summary,
  // api link.
  _links: { self: { href: 'http://api.tvmaze.com/episodes/1775970' } },
  // Datetime as a Moment<2020-02-18T13:00:00+01:00>.
  datetime
}

```

The parameters:
- series : The series (a string).

Example:
```js
let data = await allEpisodes('Lucifer');
```

# Todo
* use more precise date calculation. Right now only the date is used, not the time and timezone. This will give more accurate results when requesting episode information.
