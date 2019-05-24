import _ from 'lodash';
import Mode from './Mode';

class TextMode extends Mode {
  static id = 'TX';

  getTemplateOptions() {
    return this.opts.template;
  }

  getLabelOpts() {
    return _.merge(this.opts, {
      colors: true,
      adjustColor: true,
      transparent: true,
    });
  }
}

TextMode.prototype.id = 'TX';
TextMode.prototype.name = 'Text mode';
TextMode.prototype.shortName = 'Text';
TextMode.prototype.depGroups = ['TextLabelsGeo'];

export default TextMode;
