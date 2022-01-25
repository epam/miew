const miew = require('../packages/miew/dist/miew')

window.onload = function () {
  const viewer = new miew.Miew({
    container: document.getElementsByClassName('miew-container')[0],
    load: '1CRN'
  })

  if (viewer.init()) {
    viewer.run()
  }
}
