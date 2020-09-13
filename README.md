# Fire Map: How much of California has burned?

## Installing

```
nvm use
yarn
```

## Preparing data

1. Fetch + process the fire perimeter data:

```
yarn fetch-all-fires
```

(Note, GeoMAC's server sometimes issues 404s when trying to download, and the scraper is not as robust as it could be. You may need to run more than once to pick up all fire perimeters.)

2. Merge fires per state + year:

```
yarn merge-all-fires
```

3. Process metadata for fire perimeters:

```
yarn process-all-fires
```

## Running

First, follow the steps above to fetch + process fire perimeter data.
Then, run the application:

```
yarn start
```
