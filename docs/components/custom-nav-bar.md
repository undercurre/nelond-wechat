# 通用导航栏

## 简介

通用导航栏包含了一个插槽和默认的 title，如果 title 不满足可以通过插槽自定义

## 属性

| 参数 name  | 类型    | 必传  | 默认值      | 描述                                           |
| ---------- | ------- | ----- | ----------- | ---------------------------------------------- |
| title      | string  | false | -           | 默认样式的标题                                 |
| background | string  | false | transparent | 导航栏默认颜色                                 |
| leftArrow  | boolean | false | false       | 是否有左箭头                                   |
| zIndex     | number  | false | 1           | 导航栏层级                                     |
| disabled   | boolean | false | false       | 使 leftTap 不响应                              |
| showGoHome | string  | false | auto        | 是否有返回首页 icon,可选值`show`,`hide`,`auto` |
| leftIcon   | string  | false | false       | 返回首页的 icon                                |

## 事件

| 事件 name    | 类型 | 必传  | 描述               |
| ------------ | ---- | ----- | ------------------ |
| bind:leftTap | -    | false | 点击左箭头触发事件 |

## 插槽

| 插槽 name | 描述                                          |
| --------- | --------------------------------------------- |
| -         | 如果 title 默认样式不符合可以通过该插槽自定义 |
