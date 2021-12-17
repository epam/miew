import Miew from 'Miew'

const EDIT_MODE = { COMPLEX: 0, COMPONENT: 1, FRAGMENT: 2 }

describe('Miew', () => {
  const miew = new Miew({})
  it('its alive', () => {
    expect(miew).toBeTruthy()
  })
  it('getMaxRepresentationCount', () => {
    expect(miew.getMaxRepresentationCount()).toEqual(30)
  })
  it('makeUniqueVisualName', () => {
    expect(miew._makeUniqueVisualName('Miew')).toEqual('Miew')
    expect(typeof miew._makeUniqueVisualName()).toEqual('string')
  })
  it('addVisual', () => {
    expect(miew._addVisual()).toEqual(null)
  })
  it('rebuildAll', () => {
    const spy = jest.spyOn(miew, '_forEachComplexVisual')
    miew.rebuildAll()
    expect(spy).toBeCalled()
  })
  it('setReps', () => {
    const spy = jest.spyOn(miew, '_forEachComplexVisual')
    miew._setReps([])
    expect(spy).toBeCalled()
  })
  it('setNeedRender', () => {
    const spy = jest.spyOn(miew, 'setNeedRender')
    miew.setNeedRender()
    expect(spy).toBeCalled()
    expect(miew._needRender).toEqual(true)
  })
  it('setEditMode', () => {
    miew._setEditMode(EDIT_MODE.COMPONENT)
    expect(miew._editMode).toEqual(1)
  })
})
