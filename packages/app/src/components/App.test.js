import React from 'react';
import * as ReactDom from 'react-dom';
// import { act } from 'react-dom/test-utils';

import ViewerContainer from './viewer/ViewerContainer.jsx';
import App from './App.jsx';

jest.mock('./viewer/ViewerContainer.jsx');

let container = null;
beforeEach(() => {
  ViewerContainer.mockClear();
  // setup a DOM element as a render target
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  // cleanup on exiting
  ReactDom.unmountComponentAtNode(container);
  container.remove();
  container = null;
});

describe('App', () => {
  it('renders without crashing', () => {
    ReactDom.render(<App />, container);
  });

  // it('calls ViewerContainer at least once', () => {
  //   const app = new App();
  //   expect(ViewerContainer).toHaveBeenCalledTimes(1);
  // });

  // it('fills with default lib ref', () => {
  //   act(() => {
  //     ReactDom.render(<App />, container);
  //   });
  //   const viewer = container.getElementsByClassName('miew-container')[0];
  //   expect(viewer).toBeDefined();
  // });
});
