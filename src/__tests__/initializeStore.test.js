import { initializeStore } from '../';

describe('initializeStore', () => {
  it('should preload an empty state if it is not defined', () => {
    const store = initializeStore();
    expect(store.getState()).toEqual({});
  });

  it('should preload a state if it is defined', () => {
    const store = initializeStore({ test: 'test state' });
    expect(store.getState()).toEqual({ test: 'test state' });
  });

  it('should create a new store', () => {
    const store = initializeStore();
    expect(initializeStore()).not.toBe(store);
  });
});
