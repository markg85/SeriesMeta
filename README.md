# SeriesMeta
## About
[![npm version](https://badge.fury.io/js/seriesmeta.svg)](https://badge.fury.io/js/seriesmeta)  
[![NPM](https://nodei.co/npm/seriesmeta.png)](https://nodei.co/npm/seriesmeta/)

This package is written with home automation systems in mind. While this module won't allow you to speak to, it will allow you to integrate series data. For instance, if you make a Google Assistant module to get the current series running state you would asl something like: "Is the [series] still running?" where you would implement the response by calling the 'isSeriesEnded([series])' API method. That would return an object indicating if it's ended which gives you room to construct a scentence for you TTS engine to speak.

The module is using the awesome **TVMaze** API behind the scenes and asks all information about a series including the known episodes. That is quite a hefty request, thefore **SeriesMeta** is fully cached. Eash request you make lives in it's own cache for 1 week, series data doesn't change that often anyhow. So after your initial call, all subsequent calls on the same series are local, this also improves fetching performance quite massively as the number of webcalls is reduced to the bare minimum.

This module obviously isn't limited to speech focused tasks, it can be used with anything where you need series information.
