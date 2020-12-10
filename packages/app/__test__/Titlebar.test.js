import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import { render, screen } from '@testing-library/react';
import Titlebar from '../src/components/menu/titlebar/Titlebar.jsx';
import rootReducer from '../src/reducers';

describe('<Titlebar>', () => {
  it('should render loading stage from prop', () => {
    const store = createStore(rootReducer);
    const Wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    render(<Titlebar loadingStage='test'/>, { wrapper: Wrapper });
    expect(screen.getByText('test')).toBeDefined();
  });
});
