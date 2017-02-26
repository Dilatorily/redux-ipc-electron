import { createStore } from 'redux';
import { ipcMain, ipcRenderer } from 'electron';

let mainStore;

const DEFAULT_IDENTIFIER = 'defaultRenderer';
const UPDATE_MAIN_STORE = '@@redux-ipc-electron/UPDATE_MAIN_STORE';
const SYNC_MAIN_STORE = '@@redux-ipc-electron/SYNC_MAIN_STORE';
const REQUEST_STATE = '@@redux-ipc-electron/REQUEST_STATE';
const RESPONSE_STATE = '@@redux-ipc-electron/RESPONSE_STATE';

const reducer = (state, action) => {
  switch (action.type) {
    case UPDATE_MAIN_STORE:
      return { ...state, [action.identifier]: { ...action.state } };
    default:
      return state;
  }
};

export const initializeStore = (preloadedState = {}) => {
  mainStore = createStore(reducer, preloadedState);
  return mainStore;
};

export const createMainListeners = (onSync = () => {}) => {
  ipcMain.on(REQUEST_STATE, (event, identifier) =>
    event.sender.send(RESPONSE_STATE, identifier, mainStore.getState()[identifier] || {}));
  ipcMain.on(SYNC_MAIN_STORE, (event, identifier, state) => {
    mainStore.dispatch({ type: UPDATE_MAIN_STORE, identifier, state });
    onSync(mainStore);
  });
};

export const getMainState = (identifier = DEFAULT_IDENTIFIER) => new Promise((resolve) => {
  ipcRenderer.on(RESPONSE_STATE, (event, responseIdentifier, state) => {
    if (responseIdentifier === identifier) {
      resolve(state);
    }
  });
  ipcRenderer.send(REQUEST_STATE, identifier);
});

export const createMiddleware = (identifier, predicate) => {
  let currentIdentifier = identifier;
  let currentPredicate = predicate;

  if (typeof currentIdentifier === 'function' && typeof currentPredicate === 'undefined') {
    currentPredicate = currentIdentifier;
    currentIdentifier = undefined;
  }

  if (typeof currentIdentifier === 'undefined') {
    currentIdentifier = DEFAULT_IDENTIFIER;
  }

  if (typeof currentPredicate === 'undefined') {
    currentPredicate = state => state;
  }

  if (typeof currentIdentifier !== 'string') {
    throw new Error('Expected the identifier to be a string.');
  }

  if (typeof currentPredicate !== 'function') {
    throw new Error('Expected the predicate to be a function.');
  }

  return ({ getState }) => next => (action) => {
    const value = next(action);
    ipcRenderer.send(SYNC_MAIN_STORE, currentIdentifier, currentPredicate(getState()));
    return value;
  };
};

initializeStore();
