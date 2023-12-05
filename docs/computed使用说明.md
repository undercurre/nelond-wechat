# computed 使用说明

computed 用法推荐：

```ts
import { ComponentWithComputed } from 'miniprogram-computed'
ComponentWithComputed({
  data: {
    name: '',
  },
  computed: {
    nameComputed(data) {
      return 'My name is ' + data.name
    },
  },
  watch: {
    name(value) {
      console.log('name change:', value)
    },
  },
})
```

## 配合 mobx 使用

computed 同样可以作用于 mobx，用法：

```ts
import { ComponentWithComputed } from 'miniprogram-computed'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [userBinding] })],
  computed: {
    userInfoComputed(data) {
      if (data.userInfo) {
        // 要先使用if判空，mobx初始化时间比computed后
        return '用户:' + data.userInfo.nickname
      }
      return ''
    },
  },
})
```

## 注意

开发者工具生成的 component 默认包含代码：`properties: {}`，建议如果没有传参就删除这行，否则类型推导会有 bug。
如果是有传参，也建议最少有一个参数带上 observer，否则也会出现上述的问题，实例如下：

```ts
import { ComponentWithComputed } from 'miniprogram-computed'
ComponentWithComputed({
  properties: {
    name: {
      type: String,
      observer() {}, // 这里加上一个空的observer函数
    },
  },
  computed: {
    nameComputed(data) {
      return 'My name is ' + data.name
    },
  },
})
```
