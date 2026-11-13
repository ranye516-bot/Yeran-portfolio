# 叶然｜摄影作品集

## 本地预览

在本目录打开终端，使用 Node.js 22.12 或更新版本。

```sh
npm ci
npm run dev
```

打开终端中显示的本地地址。生产构建使用 `npm run build`，构建后可运行 `npm run preview` 检查 `dist`。

## 更新素材

- `src/content.js` 管理个人经历、数据、能力和项目。项目的 `count` 对应剧照数量，有 `duration` 的项目可播放成片。
- `src/contact.json` 管理联系页上的邮箱、电话和微信。
- `public/media` 存放首页视频、静帧和肖像。每个项目目录包含 `cover.webp`、按 `01.webp` 起编号的剧照，以及对应成片 `film.mp4`。
