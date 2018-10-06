# cloudrest.bitcoin.com

REST API for Bitcoin.com's Cloud.

## Usage

### Installation

Clone the repo

`git clone https://github.com/Bitcoin-com/cloudrest.bitcoin.com.git`

Install the deps

`cd cloudrest.bitcoin.com && yarn install`

Start the app

- `yarn start` Start server on live mode
- `yarn run dev` Start server on dev mode with nodemon
- `yarn run docs` Generate API documentation
- `yarn test` Run mocha tests

### Start dev server

- Ensure mongodb is running
- Set defaults in seed-db.js
- `yarn run seed` Seed dev appsettings
- Configure kubernetes and gcloud credentials
- `yarn run tasks` Start tasks process
- `yarn run dev` Start rest server

## Documentation

API documentation is written inline and generated by [apidoc](http://apidocjs.com/).

Visit `http://localhost:5000/docs/` to view docs

## License

MIT

Forked from https://github.com/christroutner/babel-free-koa2-api-boilerplate

[![Coverage Status](https://coveralls.io/repos/github/Bitcoin-com/cloudrest.bitcoin.com/badge.svg?branch=master)](https://coveralls.io/github/Bitcoin-com/cloudrest.bitcoin.com?branch=master)
