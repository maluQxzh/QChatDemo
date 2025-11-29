# QChat (Electron + React) – 一个最小可用的安全聊天应用 使用本地或公网信令服务器

## 运行 （或直接下载打包好的版本）

前置：已安装 Node.js

1) 安装依赖

```
npm install
```

2) 启动信令服务器（默认 8080）

```
npm run server
```

可使用环境变量自定义：

```
# Windows PowerShell 示例
$env:PORT=9000; $env:HOST="0.0.0.0"; node server/index.js
```

3) 启动前端 + Electron

```
npm run start
```

首次登录页可填写“服务器地址”：左侧为 IP/域名，右侧为端口。两者都留空则连接本地 `ws://localhost:8080` 或**使用本人已经搭建好的信令服务器**（地址已硬编码）。

可通过 Vite 环境变量预设远端地址（任选其一）：

```
# .env 或 .env.local 中
VITE_SIGNAL_SERVER_URL=ws://your-public-ip:8080
# 或
VITE_SIGNAL_SERVER_HOST=your-public-ip
VITE_SIGNAL_SERVER_PORT=8080
```


## 打包项目
```
npm run electron:pack
```

## 公网部署提示

- 服务器需具备公网 IP或域名，并开放对应端口（如 8080）。
- 确保防火墙/安全组放通 TCP 端口。
