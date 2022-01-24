import '../packages/miew/dist/miew.min.css'

function onMiewLoaded(Miew) {
  const viewer = new Miew({
    container: document.getElementsByClassName('miew-container')[0],
    load: '1CRN'
  })

  if (viewer.init()) {
    viewer.run()
  }
}

import(/* webpackChunkName: "Miew" */ '../packages/miew/dist/miew.module').then(
  ({ default: Miew }) => {
    onMiewLoaded(Miew)
  }
)
