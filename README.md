# PJSK Web UI 中心路由架构设计文档 (v2.0)
## 1. 项目概述
本项目旨在将基于 OneBot v11 协议的 PJSK 查询机器人（Haruki / Sakura 节点）转换为现代化的高性能 Web 服务。通过引入 FastAPI 构建协议桥接层，配合 Cloudflare 与雷池 WAF，实现前后端分离、安全可控的 PJSK 游戏数据查询网页平台。
## 2. 技术栈选型
 * **前端 (Web UI)**：React + Vite + TypeScript + Zustand
 * **桥接层 (Bridge API)**：FastAPI (Python + uvloop)
 * **核心数据引擎**：Haruki / Sakura Client (Linux x64)
 * **鉴权验证节点**：NoneBot2
 * **数据库与状态管理**：MySQL, Redis
 * **网络与防护**：Cloudflare Pages, CF Tunnel (Zero Trust), CF Turnstile, 长亭雷池 WAF
## 3. 系统架构与网络链路
服务器环境运行于仅具 IPv6 公网的 ESXi 虚拟机，通过内网穿透与边缘网络实现高可用与防护。
### 3.1 流量链路
前端请求 -> CF 边缘节点 (Turnstile 过滤) -> CF Tunnel 安全隧道 -> 本地雷池 WAF -> FastAPI 桥接层 (8000) -> Haruki WS 接口 (8111)
### 3.2 模块职责
 * **Web 前端**：静态托管，负责视图渲染、设备指纹生成及轮询/SSE连接。
 * **FastAPI 路由**：HTTP/WS 协议转换、鉴权拦截、图片转码及并发队列管理。
 * **验证节点**：极简 NoneBot2 实例，唯一职责是接收 QQ 验证码并内网回调。
## 4. 核心业务流转设计
### 4.1 鉴权与身份继承 (Auth & SSE Flow)
利用 QQ 体系实现设备绑定，无缝继承玩家原有的 Suite 抓包数据。
 1. Web 端发起注册，FastAPI 生成随机验证码并作为 Redis Key 存入。
 2. FastAPI 与该前端建立单向的 Server-Sent Events (SSE) 通道，监听该 Key 的状态变化。
 3. 用户通过真实 QQ 向验证节点发送验证码。
 4. 验证节点拦截后，向 FastAPI 发起内网 HTTP 确认请求。
 5. FastAPI 记录 QQ 映射，更新 Redis，并通过 SSE 即时推送成功状态，随后断开连接。前端获取 JWT Token。
### 4.2 异步查询与状态关联 (Query & Echo Flow)
 1. Web 端携带 JWT 发起 API 请求。
 2. FastAPI 解析提取 QQ 号，将请求组装为 OneBot JSON，**强制注入 UUID 作为 echo 字段**。
 3. 请求通过 WS 发送给 Haruki，同时本地创建一个以该 echo 为键的 asyncio.Future 进行挂起。
 4. **软超时降级**：若超过 15 秒未返回，接口返回 HTTP 202 Accepted 及 task_id，前端转为静默轮询。
 5. WS 后台监听任务收到 Haruki 返回后，匹配 echo 并唤醒对应 Future。
### 4.3 静态资源极速渲染 (Image Pipeline)
 1. FastAPI 拦截 Haruki 响应中的本地绝对路径。
 2. 异步调用 Pillow 将原图转换为体积更小的 WebP 格式 (quality=80)。
 3. 转码后的文件存入本地静态挂载目录，向前端下发 URL。
 4. **轻量清理**：通过 FastAPI 内置的 asyncio.sleep 循环任务，定期清理目录中超过 24 小时的缓存图片。
## 5. 安全防御机制
 * **设备级风控**：引入 FingerprintJS，数据库维护单用户上限 5 个设备的 LRU 淘汰队列，检测到新设备强制快捷验证。
 * **隔离策略**：彻底断开高并发查询与腾讯 QQ 服务器的直接网络通信，从物理层面上规避企鹅风控冻结风险。
 * **节点降级**：FastAPI 提供 /health 接口，当前端探测到验证节点离线时，自动阻断新用户注册逻辑。
## 6. 开发实施路线 (Roadmap)
 * **Phase 1: 核心链路探明 (MVP)**
   编写独立的 Python 脚本，直接连接 Haruki WS 端口。测试协议分发，重点验证 echo 字段的完整传回与高频发包的稳定性。
 * **Phase 2: 并发调度层开发**
   在 FastAPI 中实现 Future 挂起逻辑、超时降级（202 机制）以及图片拦截与 WebP 转码挂载。
 * **Phase 3: 认证中心与状态同步**
   搭建 NoneBot2 验证插件，跑通 Redis 状态机与 Web 端 SSE 推送流程。
 * **Phase 4: 前端业务对接**
   React 接入，完善状态管理与 UI 渲染。
既然明确了从 Phase 1 切入，你是打算直接在目前的服务器环境里写个测试脚本连接真实的 Haruki 节点，还是准备在本地先搭一个简单的 mock 环境来测试协议交互逻辑？
