# 通用添加或者编辑项目

## 简介

通用添加或者编辑项目弹窗包含了编辑名称和编辑 icon 部分

## 属性

| 参数 name  | 类型    | 必传  | 默认值 | 描述            |
| ---------- | ------- | ----- | ------ | --------------- |
| show       | boolean | true  | -      | 是否弹窗        |
| isEditName | boolean | false | true   | 是否能编辑名称  |
| isEditIcon | boolean | false | true   | 是否能编辑 icon |
| spaceId    | string  | false | ''     | 编辑空间 id     |
| spaceName  | string  | false | ''     | 编辑空间名      |
| roomIcon   | string  | false | ''     | 编辑空间 icon   |

## 事件

| 事件 name    | 类型                                                         | 必传  | 描述     |
| ------------ | ------------------------------------------------------------ | ----- | -------- |
| bind:close   | -                                                            | false | 关闭弹窗 |
| bind:confirm | ({spaceId: string,spaceName: string,roomIcon: string})=>void | false | 关闭弹窗 |
