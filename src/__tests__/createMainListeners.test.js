import { ipcMain } from 'electron';
import { createMainListeners, initializeStore } from '../';

describe('createMainListeners', () => {
  beforeEach(() => {
    ipcMain.on = jest.fn();
  });

  it('should listen to a REQUEST_STATE IPC event', () => {
    createMainListeners();
    expect(ipcMain.on).toHaveBeenCalledTimes(2);
    expect(ipcMain.on.mock.calls[0]).toHaveLength(2);
    expect(ipcMain.on.mock.calls[0][0]).toBe('@@redux-ipc-electron/REQUEST_STATE');
  });

  it('should send a RESPONSE_STATE IPC event to a REQUEST_STATE IPC event', () => {
    createMainListeners();
    expect(ipcMain.on.mock.calls[0][1]).toEqual(expect.any(Function));

    const event = { sender: { send: jest.fn() } };
    ipcMain.on.mock.calls[0][1](event);
    expect(event.sender.send).toHaveBeenCalledTimes(1);
    expect(event.sender.send.mock.calls[0]).toHaveLength(3);
    expect(event.sender.send.mock.calls[0][0]).toBe('@@redux-ipc-electron/RESPONSE_STATE');
  });

  it('should send the identifier in the RESPONSE_STATE IPC event', () => {
    createMainListeners();

    const event = { sender: { send: jest.fn() } };
    ipcMain.on.mock.calls[0][1](event, 'test identifier');
    expect(event.sender.send.mock.calls[0][1]).toBe('test identifier');
  });

  it('should send the identified segment of the main store in the RESPONSE_STATE IPC event', () => {
    initializeStore({ 'test identifier': { description: 'partial store' } });
    createMainListeners();

    const event = { sender: { send: jest.fn() } };
    ipcMain.on.mock.calls[0][1](event, 'test identifier');
    expect(event.sender.send.mock.calls[0][2]).toEqual({ description: 'partial store' });
  });

  it('should send an empty object in the RESPONSE_STATE IPC event if the identified segment of the main store does not exist', () => {
    initializeStore();
    createMainListeners();

    const event = { sender: { send: jest.fn() } };
    ipcMain.on.mock.calls[0][1](event, 'test identifier');
    expect(event.sender.send.mock.calls[0][2]).toEqual({});
  });

  it('should listen to a SYNC_MAIN_STORE IPC event', () => {
    createMainListeners();
    expect(ipcMain.on.mock.calls[1]).toHaveLength(2);
    expect(ipcMain.on.mock.calls[1][0]).toBe('@@redux-ipc-electron/SYNC_MAIN_STORE');
  });

  it('should dispatch a UPDATE_MAIN_STORE action to the main store on a SYNC_MAIN_STORE IPC event', () => {
    const mainStore = initializeStore();
    mainStore.dispatch = jest.fn();
    createMainListeners();
    expect(ipcMain.on.mock.calls[1][1]).toEqual(expect.any(Function));

    ipcMain.on.mock.calls[1][1]('mock event', 'mock identifier', { description: 'mock state' });
    expect(mainStore.dispatch).toHaveBeenCalledTimes(1);
    expect(mainStore.dispatch.mock.calls[0]).toEqual([{
      type: '@@redux-ipc-electron/UPDATE_MAIN_STORE',
      identifier: 'mock identifier',
      state: { description: 'mock state' },
    }]);
  });

  it('should only update the identified segment of the main store on a dispatched UPDATE_MAIN_STORE action', () => {
    const mainStore = initializeStore({
      'test identifier': { description: 'partial store' },
      identifier: { description: 'old state' },
    });
    createMainListeners();

    ipcMain.on.mock.calls[1][1]('mock event', 'identifier', { description: 'new state' });
    expect(mainStore.getState()).toEqual({
      'test identifier': { description: 'partial store' },
      identifier: { description: 'new state' },
    });
  });

  it('should call the onSync function on a SYNC_MAIN_STORE IPC event', () => {
    const mainStore = initializeStore();
    const onSync = jest.fn();
    createMainListeners(onSync);

    ipcMain.on.mock.calls[1][1]('mock event', 'mock identifier', { description: 'mock state' });
    expect(onSync).toHaveBeenCalledTimes(1);
    expect(onSync.mock.calls[0]).toEqual([mainStore]);
  });
});
