import path from 'path';

export default {
  url: null, // 'https://miew.opensource.epam.com/master',
  localPath: path.resolve(__dirname, '../../build'),
  localPort: 8008,
  threshold: 0.1, // ignore small deviations due to chromedriver updates
};
