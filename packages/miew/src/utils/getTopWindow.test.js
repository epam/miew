import { expect } from 'chai';
import getTopWindow from './getTopWindow';

describe('utils/getTopWindow()', () => {
  it('returns top window if no iframe', () => {
    const window = { location: { href: 'http://example.com' } };
    window.top = window;

    global.window = window;
    expect(getTopWindow()).to.equal(window.top);
    delete global.window;
  });

  it('returns top window if no cross-origin iframe', () => {
    const window = { location: { href: 'http://example.com/viewer.html' } };
    window.top = { location: { href: 'http://example.com/index.html' } };

    global.window = window;
    expect(getTopWindow()).to.equal(window.top);
    delete global.window;
  });

  it('returns window if called inside cross-origin iframe', () => {
    const window = { location: { href: 'http://example.com:8000' } };
    window.top = { locationRestricted: { href: 'http://example.com:8001' } };

    global.window = window;
    expect(getTopWindow()).to.equal(window);
    delete global.window;
  });
});
