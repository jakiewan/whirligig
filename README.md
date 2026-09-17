# 流光 · 记忆旋转木马

[打开互动网页](https://jakiewan.github.io/whirligig/)

Three.js 制作的照片旋转木马，支持拖动旋转、缩放、点击照片放大、暂停、微风、开关灯、添加本地照片和保存画面。添加的照片只在当前浏览器会话中使用，不会上传服务器。

## 开发与发布

需要 Node.js 22 或更新版本。

```bash
npm ci
npm run dev
npm run build
```

构建产物位于 `docs/`。GitHub Pages 使用 `main` 分支的 `docs/` 目录。修改后重新构建并提交源码与 `docs/` 即可更新网站。

图片素材属于原提供者，不因公开托管而授予他人再利用许可。
