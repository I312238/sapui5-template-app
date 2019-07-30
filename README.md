# SAP UI5 Template App
Copy this template project to build an app using SAP UI5

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

### Trouble Shooting
1. If bower is complaining about your http_proxy protocol, you need to run
```shell script
$ unset http_proxy
$ bower install
```

## Proxying
Any request under '/api/v1' will be forwarded to http://localhost:8080.<br>
This enable you develop frontend UI5 app without need to know much about backend service.<br>
You may change the proxy rule by changing `app.js`, e.g. target host, URL rewrite rules, etc.<br>
**Note** The proxying will only work in development environment. So if NODE_ENV = 'production', the proxy will not start.
