export const userRole: Home.UserRoleMap = {
  creator: 1,
  admin: 2,
  visitor: 3,
}

export enum SpaceLevel {
  park = 1,
  building = 2,
  floor = 3,
  area = 4,
}

export const spaceIcon = {
  [SpaceLevel.park]: {
    text: '园',
    color: '#7cd06a',
  },
  [SpaceLevel.building]: {
    text: '楼',
    color: '#78bdd8',
  },
  [SpaceLevel.floor]: {
    text: '层',
    color: '#9195bd',
  },
  [SpaceLevel.area]: {
    text: '区',
    color: '#f37c99',
  },
} as Record<SpaceLevel, { text: string; color: string }>
