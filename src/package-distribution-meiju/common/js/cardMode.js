const CARD_MODE = {
  default: {
    navigationBarColor: {
      frontColor: '#ffffff',
      backgroundColor: '#627BFF',
    },
    containerBgColor: 'linear-gradient(to bottom, #627BFF, #4E71F7)',
  },
  heat: {
    navigationBarColor: {
      frontColor: '#ffffff',
      backgroundColor: '#FFBB00',
    },
    containerBgColor: 'linear-gradient(to bottom, #FFBB00, #FFAA10)',
  },
  //清爽
  clear: {
    navigationBarColor: {
      frontColor: '#ffffff',
      backgroundColor: '#5BD2FF',
    },
    containerBgColor: 'linear-gradient(to bottom, #5BD2FF, #18C0FF)',
  },
  //送风
  supply: {
    navigationBarColor: {
      frontColor: '#ffffff',
      backgroundColor: '#4CD964',
    },
    containerBgColor: 'linear-gradient(to bottom, #4CD964, #3CCD55)',
  },
  //除湿
  dehumidification: {
    navigationBarColor: {
      frontColor: '#ffffff',
      backgroundColor: '#6455DC',
    },
    containerBgColor: 'linear-gradient(to bottom, #6455DC, #5939CF)',
  },
  cold: {
    navigationBarColor: {
      frontColor: '#ffffff',
      backgroundColor: '#627BFF',
    },
    containerBgColor: 'linear-gradient(to bottom, #627BFF, #4E71F7)',
  },
  boil: {
    navigationBarColor: {
      frontColor: '#ffffff',
      backgroundColor: '#F98242',
    },
    containerBgColor: 'linear-gradient(to bottom, #F98242, #F26B39)',
  },
  offline: {
    navigationBarColor: {
      frontColor: '#ffffff',
      backgroundColor: '#8A8A8F',
    },
    containerBgColor: '#8A8A8F',
  },
}

const CARD_MODE_OPTION = {
  DEFAULT: 'default',
  HEAT: 'heat',
  COLD: 'cold',
  CLEAR: 'clear',
  SUPPLY: 'supply',
  DEHUM: 'dehumidification',
  BOIL: 'boil',
  OFFLINE: 'offline',
}

module.exports = {
  CARD_MODE: CARD_MODE,
  CARD_MODE_OPTION: CARD_MODE_OPTION,
}
