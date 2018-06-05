module.exports = {
  map: true,
  plugins: [
    require('cssnano')({
      preset: 'default',
      discardUnused: false,
    }),
  ],
};
