# redux-ipc-electron
[![NPM version](https://img.shields.io/npm/v/redux-ipc-electron.svg?style=flat)](https://www.npmjs.com/package/redux-ipc-electron)
[![Build Status](https://travis-ci.org/Dilatorily/redux-ipc-electron.svg?branch=master)](https://travis-ci.org/Dilatorily/redux-ipc-electron)
[![codecov](https://codecov.io/gh/Dilatorily/redux-ipc-electron/branch/master/graph/badge.svg)](https://codecov.io/gh/Dilatorily/redux-ipc-electron)

Redux IPC Middleware for Electron

## Installation
Use NPM to install this module:
```bash
$ npm install --save redux-ipc-electron
```

## Usage
This library uses Electron's IPC to synchronizes the Redux store between the main process and the renderer process(es).

Use the Redux middleware in the renderer Redux store.
```javascript
import { createMiddleware as ReduxIPCMiddleware } from 'redux-ipc-electron';

// ...
createStore(reducers, preloadedState, applyMiddleware(thunk, ReduxIPCMiddleware(), logger));
```

Listen to the IPC events in the main process.
```javascript
import { createMainListeners } from 'redux-ipc-electron';

// ...
createMainListeners();
```

That's it! The main process will now receive the renderer's Redux store on every action.

## API
This library exposes 4 functions in its API.

### initializeStore([preloadedState])
Use this function in the main process to initialize the Redux store in the main process. It returns the main process Redux store.

The `preloadedState` will create the store using it as its initial value.

### createMainListeners([onSync])
Use this function in the main process to listen to Electron IPC events.

The `onSync` callback will be called with the updated Redux store on every IPC sync events.

### getMainState([identifier])
Use this function in the renderer process to get a part of the main process Redux store identified by the `identifier` parameter.

A default `identifier` will be used if it is omitted.

### createMiddleware([identifier], [predicate])
Use this function in the renderer process to create the middleware used in the Redux store.

The `identifier` should be used if there are multiple renderer processes. A default `identifier` will be used if it is omitted.

The `predicate` function is called with the store's `state` as its parameter. An identity function will be used if it is omitted.

## [License](LICENSE)
This repository is open source and distributed under the MIT License.
