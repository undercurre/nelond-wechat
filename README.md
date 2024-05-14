# HomLux

## 特性

项目已经自带下面的依赖：

- [UnoCSS](https://github.com/MellowCo/unocss-preset-weapp) 功能强大且性能极高的 CSS 引擎
- [Tailwind](https://tailwindcss.com/)
- [MobX](https://github.com/wechat-miniprogram/mobx-miniprogram-bindings) 官方推荐的全局状态管理库
- [computed](https://github.com/wechat-miniprogram/computed) 像写 Vue 一样写 computed 和 watch 吧
- [Vant](https://vant-contrib.gitee.io/vant-weapp) 轻量、可靠的微信小程序组件库
- SvgIcon 自实现 svg 动态加载组件，使用脚本自动从 iconify 拉取 svg 标签

项目配置了一个分包示例，可以按需求进行修改。

## 📁 代码结构

```
HomLux小程序
├── .husky // git hooks
├── build // 一些自动化脚本
├── docs // 项目文档
├── ossFile // OSS静态资源文件备份目录,对应地址：https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux
├── src // 小程序源码
    ├── apis // 后端接口封装
    ├── assets // 资源目录
          ├── svg // 存放svg文件
          ├── img // 存放图片文件
          └── lottie // 存放动画资源
    ├── components // 公用组件
    ├── behaviors // behaviors共享代码
          ├── pageBehaviors // 页面层级公共代码
          └──  //
    ├── config // 一些全局公用的配置、数据
          ├── index // 配置文件入口；环境、云端地址相关配置
          └── meta.ts // 自动生成的数据文件，记录当前版本编译、预览、上传的时间点
    ├── commons // 公共代码
          ├── templates // 公共wxml模板
          └── wxs // 公共wxs module
    ├── lib // 第三库源码文件
    ├── custom-tab-bar // 自定义tabbar（必须在这个目录，不能放别的目录）
    ├── store // 全局状态
    ├── package-distribution // 配网相关页面分包（添加设备、附近设备、连接wifi等）
    ├── package-mine // 我的相关页面分包（项目管理、空间管理、设备管理、OTA、语音控制、设备替换）
    ├── package-about // 关于 分包
    ├── package-space-control // 空间相关页面分包（空间页面控制设备、场景列表、场景管理）
    ├── package-auth // 第三方授权相关页面分包
    ├── package-automation // 场景模块相关页面分包
    ├── pages // 主包的页面（小程序主页、登录）
    └── utils // 公用方法
└── typings // 类型声明文件
```

## 环境定义

微信的环境名称，与代码中美智云的对应名称有所出入，映射关系如下：

```json
{
  "develop": "dev",
  "trial": "sit",
  "release": "prod"
}
```

具体地址配置，详见：~/src/config/index.ts

## 版本管理

生产环境：暂无定义
体验/开发环境：一般高于生产环境，在 patch 版本号（第三位）上递增
云端环境切换：我的>关于
发布时间：我的>关于

> 由于版本号只能在生产环境查询，故在体验、开发环境增加发布时间显示，该时间为上一次手动点编译、真机预览、git commit 的时间点

## 使用方法

1. 使用`npm i`或者`pnpm i`安装依赖
2. 运行`npm run unocss`或者`pnpm unocss`监听 wxml 文件并生成对应 wxss
3. 在微信开发者工具，点击：工具-构建 npm
4. 开始编写代码

## 组件文档

- [自定义导航栏](docs/components/custom-nav-bar.md)
- [项目选择下拉菜单](docs/components/project-select-menu.md)
- [SVG 图标渲染](docs/components/svg-icon.md)
- [van-button](docs/components/van-button.md)
- [设备或者场景选择弹窗](docs/components/select-card-popup.md)

## 项目规范

1. 主包页面存放在 pages 目录下，分包页面存放在 packages 目录下，如果分包内容非常多，可以按照 packageXXX 再进行区分。
2. 全局状态模型定义存放在 store 目录下，按照业务拆分模块。
3. 接口调用方式封装在 apis 目录下，可以按照业务区分模块，如果项目比较大有多个后端接口地址，可以归类到不同文件夹进行区分。
4. 接口通用的请求处理、响应处理、失败处理都封装在 utils/request 目录下，参考`utils/request/defaultRequest.ts`
   ，不通用的数据和逻辑操作通过参数传入。[参考文档](docs/request使用说明.md)
5. 无论页面和组件都统一使用 Component 进行构造。

### CSS 样式

1. 请尽量避免将静态的样式写进 `style` 中，以免影响渲染速度
2. 公共样式

| 样式名           | 描述             |
| ---------------- | ---------------- |
| `page-container` | 用于一般页面容器 |

3. Unocss 用法和 Tailwind 基本一致，可以查看[Tailwind](https://tailwindcss.com/)官方文档进行使用，微信小程序的 class
   不支持写`%`，所以要用`/`来代替，比如 w-50%可以用 w-1/2 表示，不支持`!`，要用`_el_`代替，比如：`w-50rpx!`可以用`w-50rpx_el_`
   表示
4. `Vant`的`Cell 单元格`样式已根据 UI 稿调整。可直接使用

### svg 图标

> SvgIcon 用法：SvgIcon 组件会从 globalData 读取 svg 标签，然后动态生成 url，并使用 css 渲染。项目在 build/getIconify.js
> 实现了读取一个 `/iconify.json` 文件里的`iconList`列表，然后生成 js/ts 文件，然后导入到 globalData 即可根据 svg 的名字加载
> svg。使用
> svg

### 静态资源

> 由于小程序代码包大小限制，需要将部分静态资源放到 OSS。详情可参考`src/config/img.ts`

请优先使用图标库：https://icon-sets.iconify.design/icon-park-outline/

### JS

1. 接口命名首字母大写，建议接口前可以加上 I
2. TS 类型规范，业务相关的类型定义在 typings 目录下，按需使用 namespace 和不同的 d.ts 进行拆分，如果业务复杂，还可以归类到不同文件夹进行区分。

### 跨页面通信

> 使用 mobx-miniprogram 包，使用 reaction 监听 store 里的状态变化即可，使用示例：

```
import { reaction } from 'mobx-miniprogram'
import { store } from './store/index'
component({
    data: {
        _clean: ()=>{}
    },
    methods: {
        onLoad() {
            this.data._clean = reaction(()=>store.xxx, (data, reaction)=>{...}) // 监听store里的xxx
        },
        onUnload() {
            // 页面离开时需要执行clean清除副作用，防止内存泄漏
            this.data._clean()
        }
    }
)
```

## 注意点

1. [computed 使用注意点](./docs/computed使用说明.md)
2. [lottie 使用注意点](./docs/lottie使用说明.md)
3. [mitt 使用注意点](./docs/mitt使用说明.md)
4. [mobx 使用注意点](./docs/mobx使用说明.md)
5. [request 使用注意点](./docs/request使用说明.md)
6. [storage 使用注意点](./docs/storage使用说明.md)
