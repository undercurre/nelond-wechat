import { defineConfig } from 'unocss'
import presetWeapp from 'unocss-preset-weapp'
export default defineConfig({
  presets: [presetWeapp({})],
  shortcuts: {
    'wh-full': 'w-full h-full',
    'flex-center': 'flex justify-center items-center',
    'flex-col-center': 'flex-center flex-col',
    'flex-x-center': 'flex justify-center',
    'flex-y-center': 'flex items-center',
  },
  theme: {
    colors: {
      blue: '#7cd06a',
      black: {
        '2a': '#27282A',
        '59': '#555659',
        tips: '#a2a2a2',
      },
      gray: {
        dd: '#ddd',
        f3: '#eff0f3',
      },
      red: '#ff3849',
      yellow: '#fbbb32',
      green: '#57d435',
      purple: '#7b5de9',
    },
  },
})
