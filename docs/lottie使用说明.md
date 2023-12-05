# lottie动画展示组件

可以用lottie插件将lottie格式动画渲染到canvas上，建议不要在同一个界面渲染过多的lottie动画，防止出现性能的问题

## 用法

wxml:

```html
<view>
    <canvas id="canvas1" type="2d" class="w-400rpx h-400rpx inline-block"></canvas>
</view>
```

ts：

```ts
import lottie from 'lottie-miniprogram'
import {addDevice} from '../../assets/lottie/index'

Component({
    methods: {
        loadLottieAnimation() {
            // 加载动画
            this.createSelectorQuery()
                .selectAll('#canvas1')
                .node((res) => {
                    const canvas = (res as any)[0].node
                    const context = canvas.getContext('2d')

                    canvas.width = 400
                    canvas.height = 400

                    lottie.setup(canvas)
                    const ani = lottie.loadAnimation({
                        loop: true,
                        autoplay: true,
                        animationData: JSON.parse(addDevice),
                        rendererSettings: {
                            context,
                        },
                    })

                    ani.play() // 暂停后使用play恢复播放动画
                    ani.pause() // 播放时pause暂停播放
                })
                .exec()
        }
    }
})
```

lottie.loadAnimation传入的animationData应该是一个对象，如果import的是序列化之后的字符串，需要先JSON.parse转成对象。