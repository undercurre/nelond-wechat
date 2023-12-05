# storage 使用说明

[storage.ts](/src/utils/storage.ts) 简单封装了 wx 的 storage 操作 API，默认导出 storage 和 asyncStorage 两个对象，对象的类型是：

```ts
interface Storage {
    readonly prefixKey: string
    getKey(key: string): string

    set(
        key: string,
        value: IAnyObject | string | number | boolean, // 原生类型、Date、及能够通过JSON.stringify序列化的对象
        expire?: number | null,
        encrypt?: boolean,
    ): void | Promise<WechatMiniprogram.GeneralCallbackResult> // 异步操作Storage支持加密，支持promise，加密最低版本2.21.3
    get<T, P>(key: string, def?: P, encrypt?: boolean): T | P | Promise<T | P> // encrypt需要set和get同时为true
    remove(key: string): void | Promise<WechatMiniprogram.GeneralCallbackResult>
    clear(): void | Promise<WechatMiniprogram.GeneralCallbackResult>
}
```

## 同步

同步操作 storage，执行 set、remove，clear 都只会返回 void，相对于 JS 来说就是没有返回值。

导出的 storage 的 set 默认会设置有效期，默认有效期在/src/config/index.ts 的 storageExpire 设置，**如果不需要有效期则需要在
set 方法传递 null**，`storage.set('key','value',null)`

get 默认如果没找到 key 或者已经过了有效期，则默认返回 def，如果不传递 def 默认返回 undefined。

单个 key 允许存储最大数据长度为 1MB，所有数据上限为 10MB

## 异步

`asyncStorage`：异步的方法和同步类似，不同点：

- 返回值变成 Promise
- 在 2.21.3 以上的版本支持加密，但是开启后单 key 最大长度为 0.7MB
