export const POPPER_CONTAINER_ID = 'workflow-node-popper-container'

export const popperContainerDOM = (() => {
  const div = document.createElement('div')
  div.style.position = 'fixed'
  div.style.zIndex = '9999'
  div.style.display = 'none'
  div.style.backgroundColor = '#fff'
  div.style.borderRadius = '4px'
  div.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
  div.style.minWidth = '10rem'
  div.style.flexDirection = 'column'
  div.style.gap = '2px'
  div.id = POPPER_CONTAINER_ID
  return div
})()

window.addEventListener('load', () => {
  document.body.appendChild(popperContainerDOM)
})

export function togglePopperContainer(show?: boolean) {
  popperContainerDOM.style.display = show ? 'flex' : 'none'
}