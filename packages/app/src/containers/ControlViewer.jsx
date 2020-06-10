import React from 'react';
import { connect } from 'react-redux';

import Miew from 'MiewModule'; // eslint-disable-line import/no-unresolved
import Viewer from '../components/viewer/ViewerContainer.jsx';
import { sendInfo } from '../actions';

class MiewViewer extends React.Component {
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
    this._viewer.addEventListener('buildingDone', () => {
      const names = this._viewer.getVisuals();
      const ids = [];
      for (let i = 0; i < names.length; i++) {
        const complex = this._viewer._getComplexVisual(names[i]).getComplex();
        ids.push(complex.name);
      }
      this.props.sendInfo(ids);
    });
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

  render() {
    return (<Viewer/>);
  }
}

const mapStateToProps = (state) => ({
  frozen: state.visiblePanels.visibility,
});

const mapDispatchToProps = (dispatch) => ({
  sendInfo: (ids) => dispatch(sendInfo(ids)),
});

export default connect(mapStateToProps, mapDispatchToProps)(MiewViewer);
