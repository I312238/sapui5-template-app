# SAP UI5 Template App
Copy this template project to build an app using SAP UI5

_(This project is still under construction, so will change rapidly)_

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/en/)
* [Yarn](https://yarnpkg.com)

### Install Dependencies
```shell script
$ bower install
$ yarn
```

### Run
Execute the command:
```shell script
$ set DEBUG=sapui5-template-app:* & yarn start
or
$ yarn start
```

Then open your browser and navigate to http://localhost:3000

## Trouble Shooting
1. If bower is complaining about your http_proxy protocol, you need to run
```shell script
$ unset http_proxy
$ bower install
```
