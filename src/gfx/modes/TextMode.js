import _ from 'lodash';
import utils from '../../utils';
import Mode from './Mode';

function TextMode(opts) {
  Mode.call(this, opts);
}

utils.deriveClass(TextMode, Mode, {
  id: 'TX',
  name: 'Text mode',
  shortName: 'Text',
  depGroups: ['TextLabelsGeo']
});

TextMode.prototype.getTemplateOptions = function() {
  return this.opts.template;
};

TextMode.prototype.getLabelOpts = function() {
  return _.merge(this.opts, {
    labels: this.settings.now.labels,
    colors: true,
    adjustColor: true,
    transparent: true,
  });
};

export default TextMode;

