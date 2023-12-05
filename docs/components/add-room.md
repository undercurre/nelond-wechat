# 通用添加或者编辑家庭

## 简介

通用添加或者编辑家庭弹窗包含了编辑名称和编辑icon部分

## 属性

| 参数 name    | 类型      | 必传    | 默认值  | 描述        |
|------------|---------|-------|------|-----------|
| show       | boolean | true  | -    | 是否弹窗      |
| isEditName | boolean | false | true | 是否能编辑名称   |
| isEditIcon | boolean | false | true | 是否能编辑icon |
| roomId     | string  | false | ''   | 编辑房间id    |
| roomName   | string  | false | ''   | 编辑房间名     |
| roomIcon   | string  | false | ''   | 编辑房间icon  |

## 事件

| 事件 name | 类型 | 必传 | 描述 |
|------------|-----|-------|--|
| bind:close | - | false | 关闭弹窗 |
| bind:confirm | ({roomId: string,roomName: string,roomIcon: string})=>void | false | 关闭弹窗 |


