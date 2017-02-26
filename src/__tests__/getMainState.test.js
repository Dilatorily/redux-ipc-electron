import { ipcRenderer } from 'electron';
import { getMainState } from '../';

describe('getMainState', () => {
  beforeEach(() => {
    ipcRenderer.on = jest.fn();
    ipcRenderer.send = jest.fn();
  });

  it('should return a promise for the state in the main process', () => {
    const promise = getMainState();
    expect(Promise.resolve(promise)).toBe(promise);
  });

  it('should send a REQUEST_STATE IPC event', () => {
    getMainState();
    expect(ipcRenderer.send).toHaveBeenCalledTimes(1);
    expect(ipcRenderer.send.mock.calls[0]).toHaveLength(2);
    expect(ipcRenderer.send.mock.calls[0][0]).toBe('@@redux-ipc-electron/REQUEST_STATE');
  });

  it('should send the identifier in the REQUEST_STATE IPC event', () => {
    getMainState('test identifier');
    expect(ipcRenderer.send.mock.calls[0][1]).toBe('test identifier');
  });

  it('should send the default identifier in the REQUEST_STATE IPC event if it is not specified', () => {
    getMainState();
    expect(ipcRenderer.send.mock.calls[0][1]).toBe('defaultRenderer');
  });

  it('should listen to a RESPONSE_STATE IPC event', () => {
    getMainState();
    expect(ipcRenderer.on).toHaveBeenCalledTimes(1);
    expect(ipcRenderer.on.mock.calls[0]).toHaveLength(2);
    expect(ipcRenderer.on.mock.calls[0][0]).toBe('@@redux-ipc-electron/RESPONSE_STATE');
  });

  it('should resolve the promise if the state from the RESPONSE_STATE IPC event is the requested one', async () => {
    const promise = getMainState('test identifier');
    expect(ipcRenderer.on.mock.calls[0][1]).toEqual(expect.any(Function));

    ipcRenderer.on.mock.calls[0][1]('mock event', 'test identifier', { description: 'test state' });
    expect(await promise).toEqual({ description: 'test state' });
  });

  it('should do nothing if the state from the RESPONSE_STATE IPC event is not the requested one', () => {
    const promise = getMainState('test identifier');
    expect(ipcRenderer.on.mock.calls[0][1]).toEqual(expect.any(Function));

    ipcRenderer.on.mock.calls[0][1]('mock event', 'mock identifier', { description: 'test state' });
    promise.then(() => {
      throw new Error('Expected the promise to never resolve.');
    });
  });
});
