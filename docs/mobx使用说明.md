# mobx 使用注意点

微信小程序的 mobx 有些小问题需要注意。

## 定义 observable

和 vuex 类似，mobx 也有 action 用于修改状态的方法，但是 mobx-miniprogram 基于 mobx4 修改而来，多少带点类型推导的 bug，正确的 action 定义如下：

```ts
import { observable, runInAction, action } from 'mobx-miniprogram'
import { delay } from '../utils/index' // 简单实现的延时函数，相信你也能写出来

export const store = observable({
  numA: 1,
  numB: 2,

  get sum() {
    return this.numA + this.numB
  },

  // 模拟请求接口异步修改状态
  async update() {
    await delay(1000)
    runInAction(() => {
      const sum = this.sum
      this.numA = this.numB
      this.numB = sum
    })
  },
})
```

# binding

定义完 store 之后就需要绑定到组件或者页面

```ts
import { othersBinding, spaceBinding, userBinding, projectBinding } from '../../store/index'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [othersBinding, spaceBinding, userBinding, projectBinding] })],
})
```

# Action

如果需要响应式修改 store 的值，可以使用 runInAction:

```ts
import { runInAction } from 'mobx-miniprogram'
import { store } from '../../models/index'
Page({
  // ...
  setStore(arg) {
    runInAction(() => {
      store.xxx = arg
    })
    // 或者store里面定义有action,使用store调用action：
    store.xxx(arg)
  },
})
```

**注意：如果 store 里有对象数组，则需要特殊操作**

```ts
setStore(arg) {
  runInAction(() => {
    store.myList = store.myList.map((item)=>{
      // 这里处理
    })
    // 或者使用filter之类的方法，保证list地址发生变化

    // 下面是错误演示，这样修改会导致this.data绑定的值和store不一致
    store.myList[xx].xx = arg
    store.myList = store.myList
  })
}
```
