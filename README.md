# Fire Map: How much of California has burned?

## Installing

```
nvm use
yarn
```

## Running

First, fetch the data if you have not already:

```
yarn fetch-all-fires
```

(Note, GeoMAC's server sometimes issues 404s when trying to download, and the scraper is not as robust as it could be. You may need to run twice to pick up all fire perimeters.)

Then, run the application:

```
yarn start
```
