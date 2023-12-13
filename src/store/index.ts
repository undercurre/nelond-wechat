import { configure } from 'mobx-miniprogram'
export { othersStore, othersBinding } from './others'
export { userStore, userBinding } from './user'
export { spaceStore, roomBinding } from './space'
export { projectStore, projectBinding } from './project'
export { deviceStore, deviceBinding } from './device'
export { sceneStore, sceneBinding } from './scene'
export { autosceneStore, autosceneBinding } from './autoscene'
export { otaStore, otaBinding } from './ota'

configure({ enforceActions: 'observed' })
