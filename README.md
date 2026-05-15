# PJSK Web Bridge (Mizuki/Akaboshi Gateway)

## 1. 项目概述
本项目是一个针对 Project Sekai (PJSK) 游戏数据查询的高性能 Web 网关。旨在将底层的 OneBot v11 协议节点（Haruki / Sakura Client）转换为支持高并发、前后端分离的现代化 RESTful & SSE API 服务，让玩家可以通过网页安全、极速地查询 Suite 抓包数据。

## 2. 技术栈与架构选型
* **前端 (Web UI)**：React + Vite + TypeScript + Zustand
* **中间层 (Bridge API)**：FastAPI (Python + uvloop)
* **数据引擎**：Haruki / Sakura Client (Linux x64) / HongXingOS / HongXing Virtual Terminal
* **鉴权节点**：NoneBot2
* **存储与状态**：MySQL, Redis
* **网络与边缘防护**：Cloudflare Pages (前端托管) + CF Tunnel (内网穿透) + Turnstile (人机验证) + 长亭雷池 WAF + HongXing AuthLit4

## 3. 核心流转机制

### 3.1 基于 QQ 的强身份认证 (Auth Flow)
彻底弃用传统的账号密码体系，利用 QQ 实现设备与游戏数据的双重绑定，无缝继承玩家在 Haruki 节点已有的 Suite 数据。
1.  **发起注册**：前端请求 FastAPI 生成随机验证码（如 `PJSK-8F3A`）存入 Redis，并建立 SSE (Server-Sent Events) 单向推送通道。
2.  **QQ 握手**：用户将验证码私聊发送给系统专属的 NoneBot2 验证节点。
3.  **内网放行**：NoneBot2 提取用户的真实 QQ 号，通过内网 API 告知 FastAPI。FastAPI 完成数据库映射，通过 SSE 实时唤醒前端并下发 JWT Token。

### 3.2 异步查询与 Echo 唤醒 (Query Flow)
利用 OneBot 协议原生的 `echo` 字段，解决单点 WebSocket 处理多并发请求的上下文错乱问题。
1.  **请求拦截**：Web 端发起查询，FastAPI 提取 JWT 中的 QQ 号，组装 OneBot JSON 数据包，并强制注入 UUID 作为 `echo` 字段。
2.  **挂起机制**：请求通过 WS 发送给 Haruki，FastAPI 本地创建一个以该 `echo` 为键的 `asyncio.Future`。
3.  **异步唤醒**：后台 WS 监听任务收到 Haruki 的对应 `echo` 返回包后，精确唤醒对应的 HTTP 响应。
4.  **软超时降级**：对于高算力指令（如 `/组卡`），设定 15 秒软超时。超时后返回 `HTTP 202` 与 `task_id`，前端转为静默轮询，彻底释放 ASGI Worker 连接。

### 3.3 图片旁路极速渲染 (Image Pipeline)
解决原生机器人架构下图片体积过大导致的 Web 端渲染阻塞。
1.  **路径捕获**：FastAPI 拦截 Haruki 响应中的本地图片绝对路径 (`file:///...`)。
2.  **实时转码**：异步调用 `Pillow` 将原图转换为体积缩减约 80% 的 WebP 格式 (Quality=80)。
3.  **静态下发**：转码图片存入本地 Static 挂载目录，向前端返回访问 URL，利用浏览器原生缓存实现秒开。
4.  **轻量回收**：FastAPI 后台协程定期清理超过 24 小时的临时 WebP 图片，防止磁盘 OOM。

## 4. 纵深防御体系
* **物理隔离风控**：高频的 Web 查询业务全程不连接腾讯 QQ 服务器，仅由本地 Haruki 节点消化伪装的 OneBot 数据包，实现真正的 0 冻结风险。
* **设备级熔断**：结合 FingerprintJS，数据库端维护单账户上限 5 个设备的 LRU 淘汰队列，新设备强制重新验证。
* **边缘安全**：CF Tunnel 隐藏源站 IPv6 地址，Turnstile 阻断脚本注册，雷池 WAF 兜底应用层 CC 与注入攻击。

## 5. 阶段性开发路线 (Roadmap)
* **Phase 1: 核心协议层 (POC)**
    * 搭建 FastAPI 基础框架，建立与 Haruki 的 WebSocket 守护连接。
    * 重点实装并压测基于 `echo` 字段的 `Future` 挂起/唤醒机制，探明数据引擎的高频发包稳定性。
* **Phase 2: 并发控制与资源层**
    * 引入超时降级 (202 Accepted) 逻辑。
    * 实装本地图片拦截与 WebP 转码挂载。
* **Phase 3: 认证与状态中心**
    * 部署 NoneBot2 验证插件，跑通 Redis 状态机。
    * 完成 Web 端 SSE 状态流推送接口。
* **Phase 4: 业务全量接入**
    * React 前端工程化，对接 API。
    * 按模块（个人中心、查卡图鉴、榜线仪表盘、组卡计算）进行视图渲染与联调。
    
