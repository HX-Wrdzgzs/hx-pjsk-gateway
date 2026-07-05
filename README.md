# hx-pjsk-gateway

Project Sekai 网页查分终端与数据可视化网关。

本项目用于把底层 OneBot v11 协议节点与网页端查询体验连接起来，让用户不必在群聊中反复发送指令，也能通过 Web 页面完成 PJSK 数据查询、鉴权和结果查看。

## 项目定位

`hx-pjsk-gateway` 是一个 Web Gateway，而不是单纯的机器人插件。它位于用户浏览器、QQ 鉴权节点、OneBot / Haruki 数据节点之间，负责完成身份确认、请求转发、异步响应匹配和结果格式化。

```text
Browser / Web UI
        ↓
Gateway API
        ↓
QQ / NoneBot2 authentication
        ↓
OneBot v11 bridge
        ↓
Haruki / Sakura data node
```

## 技术栈与架构

- **前端**：React + Vite + TypeScript + Zustand
- **网关层**：FastAPI + asyncio / uvloop
- **数据节点**：Haruki / Sakura Client / OneBot v11
- **鉴权节点**：NoneBot2
- **存储与状态**：MySQL + Redis
- **边缘与防护**：Cloudflare Pages、Cloudflare Tunnel、Turnstile、WAF、AuthLit4

## 核心机制

### QQ 强身份认证

项目不采用传统账号密码体系，而是通过 QQ 验证流程确认用户身份，并把网页会话与机器人侧已有数据绑定。

典型流程：

1. 前端请求 Gateway 生成一次性验证码。
2. Gateway 将验证码写入 Redis，并建立 SSE 状态通道。
3. 用户将验证码私聊发送给验证机器人。
4. NoneBot2 验证节点读取用户真实 QQ 号，并回调 Gateway。
5. Gateway 完成绑定映射，通过 SSE 唤醒网页端并下发会话凭证。

### 异步查询与 echo 唤醒

Gateway 利用 OneBot 协议中的 `echo` 字段隔离并发请求。

1. Web 端发起查询。
2. Gateway 根据用户身份组装 OneBot 请求，并注入 UUID 作为 `echo`。
3. 本地创建以 `echo` 为键的 `asyncio.Future`。
4. 后台 WebSocket 监听任务收到对应响应后唤醒请求。
5. 对耗时任务返回 `202 Accepted` 与 `task_id`，前端改为轮询或恢复查询。

### 图片旁路处理

机器人侧返回本地图片路径时，Gateway 可以拦截并转换为 Web 可访问资源。

- 捕获 `file:///...` 本地图片路径。
- 转换为 WebP 等更适合网页传输的格式。
- 挂载到静态资源目录。
- 返回浏览器可直接访问的 URL。
- 定期清理临时图片，避免磁盘占用失控。

## 安全边界

- Web 查询业务与 QQ 官方连接链路解耦，降低高频 Web 请求直接冲击机器人侧的风险。
- 验证码应具备有效期，并绑定会话上下文。
- JWT / Session Token 不应在日志中明文输出。
- 内网 Haruki / OneBot 节点不应直接暴露到公网。
- Cloudflare Tunnel 只负责入口隐藏，不应替代应用层鉴权。
- 图片旁路目录应限制访问范围，避免任意文件读取。

## 阶段性路线

### Phase 1：核心协议层

- 搭建 Gateway 基础框架。
- 建立与 Haruki / OneBot 节点的 WebSocket 守护连接。
- 验证基于 `echo` 的 Future 挂起与唤醒机制。

### Phase 2：并发控制与资源层

- 引入软超时与 `202 Accepted` 降级。
- 实装任务状态查询。
- 接入图片路径捕获、WebP 转码与静态资源挂载。

### Phase 3：认证与状态中心

- 部署 NoneBot2 验证插件。
- 跑通 Redis 验证码状态机。
- 完成 SSE 状态推送。

### Phase 4：业务全量接入

- 完成 React 前端工程化。
- 接入个人中心、查卡图鉴、榜线仪表盘、组卡计算等视图。
- 完善异常提示、重试与任务恢复。

## 维护说明

本仓库涉及 Web 鉴权、机器人协议桥接和游戏数据展示。新增功能时应优先保证：

- 身份映射正确
- 并发请求不会串包
- 失败请求可恢复或明确报错
- 敏感配置不进入前端包
- 机器人侧返回内容经过必要清洗后再展示

## License

Not selected yet.
