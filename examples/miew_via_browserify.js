const Miew = require('../packages/lib/build/dist/Miew')

window.onload = function () {
  const viewer = new Miew({
    container: document.getElementsByClassName('miew-container')[0],
    load: '1CRN'
  })

  if (viewer.init()) {
    viewer.run()
  }
}
