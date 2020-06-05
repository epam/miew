import React from 'react';
import Miew from 'MiewModule'; // eslint-disable-line import/no-unresolved
import 'MiewStyles'; // eslint-disable-line import/no-unresolved

export default class ViewerContainer extends React.Component {
  constructor(props) {
    super(props);
    this._viewer = null;
    this._onChange = this._onChange.bind(this);
  }

  _onChange = (prefs) => {
    this.props.onChange({ prefs });
  };

  componentDidMount() {
    this._viewer = window.miew = new Miew({ container: this.domElement, load: '1crn' });
    this._viewer.settings.addEventListener('change:axes', this._onChange);
    this._viewer.settings.addEventListener('change:autoRotation', this._onChange);
    this.props.onChange({ viewer: this._viewer });
    if (this._viewer.init()) {
      this._viewer.run();
    }
  }

  componentWillUnmount() {
    // this._viewer.settings.now.removeEventListener(this._onChange);
    this._viewer.dispose();
    this._viewer = null;
    this.props.onChange({ viewer: this._viewer });
  }

  componentDidUpdate(prevProps) {
    if (this.props.frozen !== prevProps.frozen) {
      if (this.props.frozen) {
        this._viewer.halt();
      } else {
        this._viewer.run();
      }
    }
  }

  // shouldComponentUpdate() {
  //   return false;
  // }

  render() {
    return <div className='miew-container' ref={this.domElement}/>;
  }
}

ViewerContainer.defaultProps = {
  frozen: false,
};
