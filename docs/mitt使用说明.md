# mitt 事件总线使用订阅

目前全局事件除了能使用 mobx 进行数据驱动的事件通知，还可以使用 mitt 进行事件通知。主要用在 websocket 接收到云端推送后发布事件通知。

## 使用方法

先找到[mitt 定义文件](../src/utils/eventBus.ts)

先定义事件的类型，格式：`事件名: 事件传递的数据`

```ts
type Events = {
  // 从websocket接受到信息 start
  bind_device: {
    deviceId: string
  } // 绑定子设备
  wsReceive: {
    result: {
      eventData: IAnyObject
      eventType: keyof typeof WSEventType
    }
  }
  // 从websocket接受到信息 end
  deviceEdit: void
  sceneEdit: void
  projectInfoEdit: void
  invite_user_house: void
}
```

事件订阅和发布

```ts
import { emitter } from '../../utils/eventBus'

// 订阅事件：
emitter.on('wsReceive', (data) => {})

// 发布事件通知
emitter.emit('deviceEdit')
```
