import { ipcRenderer } from 'electron';
import { createMiddleware } from '../';

describe('createMiddleware', () => {
  beforeEach(() => {
    ipcRenderer.send = jest.fn();
  });

  it('should throw an error if the identifier is not a string', () => {
    expect(() => createMiddleware({})).toThrowError('Expected the identifier to be a string.');
  });

  it('should throw an error if the predicate is not a function', () => {
    expect(() => createMiddleware('test identifier', 'test predicate')).toThrowError('Expected the predicate to be a function.');
  });

  it('should return a Redux middleware', () => {
    const middleware = createMiddleware();
    expect(middleware).toEqual(expect.any(Function));

    const store = { getState: () => {} };
    const nextHandler = middleware(store);
    expect(nextHandler).toEqual(expect.any(Function));

    const next = jest.fn(() => 'test next');
    const actionHandler = nextHandler(next);
    expect(actionHandler).toEqual(expect.any(Function));

    const results = actionHandler('test action');
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toEqual(['test action']);
    expect(results).toBe('test next');
  });

  it('should send a SYNC_MAIN_STORE IPC event', () => {
    const middleware = createMiddleware();
    const store = { getState: () => {} };
    const nextHandler = middleware(store);
    const actionHandler = nextHandler(() => {});
    actionHandler();
    expect(ipcRenderer.send).toHaveBeenCalledTimes(1);
    expect(ipcRenderer.send.mock.calls[0]).toHaveLength(3);
    expect(ipcRenderer.send.mock.calls[0][0]).toBe('@@redux-ipc-electron/SYNC_MAIN_STORE');
  });

  it('should have a default value for the identifier', () => {
    const middleware = createMiddleware();
    const store = { getState: () => {} };
    const nextHandler = middleware(store);
    const actionHandler = nextHandler(() => {});
    actionHandler();
    expect(ipcRenderer.send.mock.calls[0][1]).toBe('defaultRenderer');
  });

  it('should have an identity function for the predicate', () => {
    const middleware = createMiddleware();
    const store = { getState: () => ({ description: 'test predicate', data: 'state data' }) };
    const nextHandler = middleware(store);
    const actionHandler = nextHandler(() => {});
    actionHandler();
    expect(ipcRenderer.send.mock.calls[0][2]).toEqual({ description: 'test predicate', data: 'state data' });
  });

  it('should be able to detect if its single parameter is the predicate', () => {
    const middleware = createMiddleware(() => ({ description: 'single predicate' }));
    const store = { getState: () => {} };
    const nextHandler = middleware(store);
    const actionHandler = nextHandler(() => {});
    actionHandler();
    expect(ipcRenderer.send.mock.calls[0][2]).toEqual({ description: 'single predicate' });
  });

  it('should send the identifier in the SYNC_MAIN_STORE IPC event', () => {
    const middleware = createMiddleware('test identifier');
    const store = { getState: () => {} };
    const nextHandler = middleware(store);
    const actionHandler = nextHandler(() => {});
    actionHandler();
    expect(ipcRenderer.send.mock.calls[0][1]).toBe('test identifier');
  });

  it('should use the predicate in the SYNC_MAIN_STORE IPC event', () => {
    const middleware = createMiddleware('test identifier', ({ description }) => ({ description }));
    const store = { getState: () => ({ description: 'test predicate', data: 'state data' }) };
    const nextHandler = middleware(store);
    const actionHandler = nextHandler(() => {});
    actionHandler();
    expect(ipcRenderer.send.mock.calls[0][2]).toEqual({ description: 'test predicate' });
  });
});
