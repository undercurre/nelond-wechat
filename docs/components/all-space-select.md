# 通用空间选择

## 简介

通用空间选择组件包含了一个 cell，tab，以及 popup，提供 cellStyle 自定义样式，如果仍然不满足可以通过隐藏组件自带 cell 和 tab，使用自定义打开按钮搭配 popup 使用。

## 属性

| 参数 name     | 类型    | 必传  | 默认值 | 描述                                                                                                                                         |
| ------------- | ------- | ----- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| show          | boolean | false | false  | 是否展示 popup 弹窗                                                                                                                          |
| showCell      | boolean | false | true   | 是否展示 cell（打开 popup 的按钮）                                                                                                           |
| showTab       | boolean | false | true   | 是否展示 tab（当选中四层空间时提供 tab 快速切换同级空间                                                                                      |
| cellStyle     | string  | false | ''     | 自定义组件 cell 和 tab 的外层样式                                                                                                            |
| dataTypeList  | array   | false | []     | 筛选只存在该设备类型的空间（device 存在任意可控设备/scene 场景/sensor 传感器/switch 开关和智慧屏/light 灯光/gateway 网关）                   |
| filter        | boolean | false | true   | 筛选空间时是否过滤非公共空间，仅 dataTypeList 不为空数组时有效（因为目前需求为展示所有公共空间，则无需使用 filter 该属性，默认为 true 即可） |
| init          | boolean | false | true   | 初始化时是否自动选中首个空间（当 targetSpaceId 属性不为空时无效）                                                                            |
| initConfirm   | boolean | false | true   | 初始化自动选中首个空间时是否需要触发 confirm 方法（仅当 init 属性为 true 且 targetSpaceId 属性为空时有效）                                   |
| targetSpaceId | string  | false | ''     | 初始化时自动选中该空间                                                                                                                       |

## 事件

| 事件 name    | 类型 | 必传  | 描述                                                 |
| ------------ | ---- | ----- | ---------------------------------------------------- |
| bind:confirm | -    | false | 点击弹窗的确认触发事件，返回当前选中的每一层空间信息 |
