# 滑动条

> 代替 `van-slider` 使用，可设置更多样式，拖动使用 `wxs` 渲染样式，效率更高

## 属性

### 直接传值

| 参数 name     | 类型     | 必传  | 默认值 | 描述                            |
| ------------- | -------- | ----- | ------ | ------------------------------- |
| disabled      | boolean  | false | false  | 是否处于禁用状态                |
| useButtonSlot | boolean  | false | false  | 是否使用自定义滑条按钮插槽      |
| activeColor   | string   | false | -      | 滑条已激活部分样式              |
| inactiveColor | string   | false | -      | 滑条未激活部分样式              |
| value         | number   | false | 1      | 滑条当前值（min~max）           |
| barHeight     | number   | false | 80     | 滑条高度(rpx)                   |
| btnHeight     | number   | false | 72     | 滑条按钮高度(rpx)               |
| formatter     | function | false | -      | 内置的 toast 显示内容的格式化器 |

### dataset 传值

| dataset    | 类型    | 必传  | 默认值   | 描述                                 |
| ---------- | ------- | ----- | -------- | ------------------------------------ |
| key        | string  | false | 'common' | 区分不同的组件实例                   |
| min        | number  | false | 0        | 最小值                               |
| max        | number  | false | 100      | 最大值                               |
| isBtnInset | boolean | false | true     | 按钮是否内嵌在滑条内部（不超出两端） |
| showToast  | boolean | false | false    | 拖动按钮时，是否显示内置的 toast     |

## 事件

| 事件 name        | 类型 | 必传  | 描述               |
| ---------------- | ---- | ----- | ------------------ |
| bind:slideChange | -    | false | 滑动过程，节流触发 |
| bind:slideEnd    | -    | false | 滑动结束时触发     |
| bind:slideStart  | -    | false | 滑动开始时触发     |
