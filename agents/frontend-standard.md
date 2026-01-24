# 前端开发规范

## 页面规范

### 模块规范

- pages/index
  - api # 存放API文件，从 `src/api/request` 引入请求方法，请求统一命名为 `apiXXXX`，如 `apiGetUsers`
  - assets # 静态资源文件
  - components # 页面内组件，如果存在多页面通用组件，则将组件放入 `src/components`
    - 组件如果较为复杂，需要将组件名字设置为文件夹，并在里面创建 `index.tsx` 作为组件导出出口
  - constants # 页面用的映射常量，如 Table 的列字段，枚举等
  - hooks # 页面布局文件
  - layouts # 页面布局文件
  - pages # 当前页面的子页面，一般不建议这样套，除非子页面必须经过当前页面的 layout 去做展示时才使用
  - store # 当前模块下的共享状态
  - types # 当前模块下的共享类型
  - index.tsx # 页面文件入口

根目录文件夹划分也

### 目录规范

- `src/pages` 对应域名根路径
- `src/pages/test` 对应 `test` 路径
- 用 `[xxx]` 代表路径参数名
- 用 `[...xxx]` 代表接受剩余参数

## 网络请求

全局响应格式如下：

```ts
interface StatusResposne<T> {
  code: number,
  msg: string,
  data: T
}
```

如果需要详细关注网络请求的状态变化，并修改相关 UI 表现，可以使用 `hooks/useRequest.ts` 对请求封装。

## 组件库

采用 `antd 5.x` 版本，并配备图标库
