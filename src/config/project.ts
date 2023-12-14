export enum SpaceLevel {
  park = 1,
  building = 2,
  floor = 3,
  area = 4,
}

export const SpaceConfig = {
  [SpaceLevel.park]: {
    text: '园',
    name: '园区',
    color: '#7cd06a',
  },
  [SpaceLevel.building]: {
    text: '楼',
    name: '楼栋',
    color: '#78bdd8',
  },
  [SpaceLevel.floor]: {
    text: '层',
    name: '楼层',
    color: '#e2ad4d',
  },
  [SpaceLevel.area]: {
    text: '区',
    name: '区域',
    color: '#f37c99',
  },
} as Record<SpaceLevel, { text: string; name: string; color: string }>
