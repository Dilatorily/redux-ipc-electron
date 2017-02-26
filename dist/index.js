'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMiddleware = exports.getMainState = exports.createMainListeners = exports.initializeStore = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _redux = require('redux');

var _electron = require('electron');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var mainStore = void 0;

var DEFAULT_IDENTIFIER = 'defaultRenderer';
var UPDATE_MAIN_STORE = '@@redux-ipc-electron/UPDATE_MAIN_STORE';
var SYNC_MAIN_STORE = '@@redux-ipc-electron/SYNC_MAIN_STORE';
var REQUEST_STATE = '@@redux-ipc-electron/REQUEST_STATE';
var RESPONSE_STATE = '@@redux-ipc-electron/RESPONSE_STATE';

var reducer = function reducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var action = arguments[1];

  switch (action.type) {
    case UPDATE_MAIN_STORE:
      return _extends({}, state, _defineProperty({}, action.identifier, _extends({}, action.state)));
    default:
      return state;
  }
};

var initializeStore = exports.initializeStore = function initializeStore() {
  var preloadedState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  mainStore = (0, _redux.createStore)(reducer, preloadedState);
  return mainStore;
};

var createMainListeners = exports.createMainListeners = function createMainListeners() {
  var onSync = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

  _electron.ipcMain.on(REQUEST_STATE, function (event, identifier) {
    return event.sender.send(RESPONSE_STATE, identifier, mainStore.getState()[identifier] || {});
  });
  _electron.ipcMain.on(SYNC_MAIN_STORE, function (event, identifier, state) {
    mainStore.dispatch({ type: UPDATE_MAIN_STORE, identifier: identifier, state: state });
    onSync(mainStore);
  });
};

var getMainState = exports.getMainState = function getMainState() {
  var identifier = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_IDENTIFIER;
  return new Promise(function (resolve) {
    _electron.ipcRenderer.on(RESPONSE_STATE, function (event, responseIdentifier, state) {
      if (responseIdentifier === identifier) {
        resolve(state);
      }
    });
    _electron.ipcRenderer.send(REQUEST_STATE, identifier);
  });
};

var createMiddleware = exports.createMiddleware = function createMiddleware(identifier, predicate) {
  var currentIdentifier = identifier;
  var currentPredicate = predicate;

  if (typeof currentIdentifier === 'function' && typeof currentPredicate === 'undefined') {
    currentPredicate = currentIdentifier;
    currentIdentifier = undefined;
  }

  if (typeof currentIdentifier === 'undefined') {
    currentIdentifier = DEFAULT_IDENTIFIER;
  }

  if (typeof currentPredicate === 'undefined') {
    currentPredicate = function currentPredicate(state) {
      return state;
    };
  }

  if (typeof currentIdentifier !== 'string') {
    throw new Error('Expected the identifier to be a string.');
  }

  if (typeof currentPredicate !== 'function') {
    throw new Error('Expected the predicate to be a function.');
  }

  return function (_ref) {
    var getState = _ref.getState;
    return function (next) {
      return function (action) {
        var value = next(action);
        _electron.ipcRenderer.send(SYNC_MAIN_STORE, currentIdentifier, currentPredicate(getState()));
        return value;
      };
    };
  };
};

initializeStore();