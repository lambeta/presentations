# Palantir 产品、Ontology 与 DDD：视频清单与观看路径

> 核验时间：2026-11-25。精挑 23 个视频，另附 3 个延伸资源；官方内容优先、中英文搭配，时长与发布日期取自平台，链接均做过有效性核验。官方视频以英文为主，YouTube 可开「自动翻译」中文字幕。

## 30 秒结论：先看这三个

| 主题 | 视频 | 时长 | 为什么先看 |
| --- | --- | --- | --- |
| 产品全景 | [Palantir Explained: Chief Architect on Foundry in 2022](https://www.youtube.com/watch?v=ZGGRCTTjLfQ) | 7:39 | Palantir 官方架构师用一次访谈讲清 Foundry 的设计逻辑，比产品页更适合建立第一印象 |
| 本体论 | [Palantir Ontology Overview](https://www.youtube.com/watch?v=YDAxITCNcko) | 5:04 | 2025 年 11 月发布的官方总览，5 分钟建立「对象、属性、关系、函数、动作」的框架 |
| DDD | [What is DDD — Eric Evans — DDD Europe 2019](https://www.youtube.com/watch?v=pMuiVlnGqjk) | 57:06 | DDD 作者本人讲什么是 DDD，最权威的入口；时间不够可先看 8 分钟版（见第三节） |

## 推荐观看顺序

| 顺序 | 看什么 | 大概耗时 | 看完应能回答 |
| --- | --- | --- | --- |
| 1 | 产品 5 个视频（Foundry / AIP / Gotham / Apollo / 完整演示） | 约 1 小时 | Palantir 到底卖什么，四个产品之间是什么关系 |
| 2 | Ontology Overview → Business As Code → Ontology Foundations | 约 45 分钟 | 本体为什么是 Foundry/AIP 的核心，它由哪些要素组成 |
| 3 | Ontology Governance（B 站中文版）→ 动手建第一个本体 | 约 1 小时 | 本体怎么建才不变成「上帝对象」，有哪些反模式 |
| 4 | Evans 的 What is DDD → Bounded Contexts → Event Storming | 约 2 小时 | 怎么划业务边界、怎么用事件风暴产出领域模型 |
| 5 | DDD & LLMs → AIP Agents and Ontology-MCP | 约 1.5 小时 | 本体和 DDD 在 Agent 时代分别扮演什么角色 |

如果只有一小时：产品全景（7:39）+ Ontology Overview（5:04）+ 8 分钟 DDD 概览（8:42）+ B 站《如何正确构建稳健的本体》（30:40），合计约 52 分钟。

## 一、Palantir 主要产品（官方）

Palantir 对外讲的产品矩阵通常分四块：Gotham（国防与情报）、Foundry（商业数据与运营平台）、Apollo（软件交付与运维）、AIP（把大模型能力接到 Foundry/本体之上）。Ontology 是 Foundry 和 AIP 的核心层。

| 产品 | 视频 | 时长 / 发布 | 看什么 |
| --- | --- | --- | --- |
| Foundry | [Palantir Explained: Chief Architect on Foundry in 2022](https://www.youtube.com/watch?v=ZGGRCTTjLfQ) | 7:39 · 2022-03 | 官方架构师访谈，讲 Foundry 为什么这样设计，适合作为产品第一课 |
| AIP | [Introducing Palantir AIP \| Capabilities and Product Demo](https://www.youtube.com/watch?v=Xt_RLNx1eBM) | 5:42 · 2023-04 | AIP 的定位与产品演示：大模型如何接进本体和业务动作 |
| Gotham | [Palantir Gotham for Defense Decision Making](https://www.youtube.com/watch?v=rxKghrZU5w8) | 5:20 · 2021-06 | 国防/情报场景的决策闭环，理解 Palantir 的起点 |
| Apollo | [Palantir Apollo 2023 \| Mission Control for Software Deployment](https://www.youtube.com/watch?v=XmLVuZKd2L0) | 4:32 · 2023-05 | 跨云、跨密级的持续交付与运维，产品矩阵里最容易被忽略的一块 |
| 完整演示 | [Foundry 2022 Operating System Demo](https://www.youtube.com/watch?v=uF-GSj-Exms) | 48:59 · 2022-04 | 完整产品演示，想看清「数据 → 本体 → 应用」全链路时看 |

## 二、Ontology 本体论（官方为主）

先建立概念框架，再看产品能力，最后看治理与 Agent。官方把本体的核心要素概括为对象、属性、关系、函数、动作（object types / properties / link types / functions / action types）。

| 层次 | 视频 | 时长 / 发布 | 看什么 |
| --- | --- | --- | --- |
| 概念首选 | [Palantir Ontology Overview](https://www.youtube.com/watch?v=YDAxITCNcko) | 5:04 · 2025-11 | 官方最新总览，先把五个核心要素分清楚 |
| 为什么 | [Ontology: Your Business As Code \| CTO Shyam Sankar](https://www.youtube.com/watch?v=6AbhxD_8Wo0) | 18:33 · 2023-02 | 从 CTO 视角讲「业务即代码」，本体为什么是 Palantir 的核心叙事 |
| 产品能力 | [Product Launch: Ontology Foundations \| DevCon 5](https://www.youtube.com/watch?v=dz20P3j3GMc) | 16:53 · 2026-03 | 2026 年 DevCon 的本体能力发布，适合看平台演进方向 |
| 进阶 | [Deep Dive: Advanced Ontology \| DevCon 5](https://www.youtube.com/watch?v=_b2qsKz_Ifk) | 24:39 · 2026-03 | DevCon 5 的进阶场，适合已经建过本体、想深入的人 |
| 治理 | [Ontology Governance \| Building a Robust Ontology](https://www.youtube.com/watch?v=mzBDupsPPcs) | 30:40 · 2026-06 | 架构师与 FDE 讲四条设计原则和反模式（上帝对象、动作蔓延）；B 站有中文版 |
| Agent 时代 | [Product Launch: AIP Agents and Ontology-MCP \| DevCon 4](https://www.youtube.com/watch?v=QMKRMEuCoaU) | 17:16 · 2026-02 | 本体如何通过 MCP 被 Agent 消费，直接回答「AI 时代为什么还需要本体」 |

### 动手与通俗解释（第三方）

| 视频 | 时长 / 发布 | 看什么 |
| --- | --- | --- |
| [How to Build Your First Ontology in Palantir Foundry \| Start to Finish](https://www.youtube.com/watch?v=6Ozqf7pkJFw) | 11:33 · 2026-02 | 手把手建第一个本体；B 站有中文版（见第四节） |
| [What the Heck is Palantir's Ontology?](https://www.youtube.com/watch?v=ZgokFqUAAsE) | 8:02 · 2024-10 | 第三方频道里最通俗的解释之一，适合先建立直觉 |
| [Build with Us \| Deep Dive: Your first Ontology](https://www.youtube.com/watch?v=SOW0IA_I0bk) | 24:06 · 2024-09 | 一次完整的实战 walkthrough，跟着做一遍，建立最小闭环的手感 |

## 三、DDD 与相关方法

| 主题 | 视频 | 时长 / 发布 | 看什么 |
| --- | --- | --- | --- |
| 总览 | [What is DDD — Eric Evans — DDD Europe 2019](https://www.youtube.com/watch?v=pMuiVlnGqjk) | 57:06 · 2019 | DDD 作者本人讲什么是 DDD，最权威的入口 |
| 边界 | [Bounded Contexts — Eric Evans — DDD Europe 2020](https://www.youtube.com/watch?v=am-HXycfalo) | 34:02 · 2020 | 讲透限界上下文，这是 DDD 最难也最关键的部分 |
| 工作坊方法 | [Event Storming — Alberto Brandolini — DDD Europe 2019](https://www.youtube.com/watch?v=mLXQIYEwK24) | 35:21 · 2019 | 用事件风暴把领域跑一遍，产出事件、命令、聚合，和本体建模能直接衔接 |
| AI 时代 | [DDD & LLMs — Eric Evans — DDD Europe](https://www.youtube.com/watch?v=lrSB9gEUJEQ) | 1:07:56 · 2024 | Evans 谈 LLM 时代的 DDD，和「本体 + Agent」是同一组问题 |
| 快速概览 | [Domain Driven Design: What You Need To Know](https://www.youtube.com/watch?v=4rhzdZIDX_k) | 8:42 · 2023 | 8 分钟建立直觉，适合先看这个再决定要不要深入 |

## 四、中文讲解

| 视频 | 时长 / 发布 | 看什么 |
| --- | --- | --- |
| [Palantir官方：如何正确构建稳健的本体](https://www.bilibili.com/video/BV1gRT567EUH) | 30:40 · 2026-06 | 官方 Ontology Governance 的中文版，四原则 + 反模式，最适合中文团队 |
| [如何在 Palantir Foundry 中从头至尾构建你的第一个 Ontology](https://www.bilibili.com/video/BV17RQzB6EXf) | 11:34 · 2026-03 | 跟着做一遍，先有手感，再回头看治理原则 |
| [12分钟学习LLM驱动Ontology构建](https://www.bilibili.com/video/BV1UbL46wEwm) | 12:46 · 2026-05 | 看 LLM 如何参与本体构建，偏实战 |
| [白话讲解领域驱动设计（DDD）](https://www.youtube.com/watch?v=Bl39p7SfuJk) | 45:26 · 2022 | 中文、口语化，适合完全没接触过 DDD 的人 |

延伸（按需，不必先看）：

- [8小时掌握 DDD 领域驱动设计](https://www.bilibili.com/video/BV1ePBHBCEce)（B 站，8:45:26）：系统长课，适合当参考书，不建议一开始就啃。
- [3小时零基础入门 FDE：Ontology 业务本体原理与实战](https://www.bilibili.com/video/BV1dcaZ6zE22)（B 站，3:49:12）：和 FDE 训练相关，含项目实战；第三方课程，先看目录再决定。
- [AI 时代的本体论前沿入门课](https://time.geekbang.org/course/intro/101163801)（极客时间，约 3 小时，付费，以页面为准）：按公开大纲覆盖 Palantir Ontology 的三层架构与五大要素，未逐节核验。

## 五、本体论和 DDD 是什么关系

两者不是并列的两个产品概念，而是「方法论」和「运行时载体」的关系。

- **DDD 解决的是建模问题**：业务太复杂时，怎么划边界（限界上下文）、怎么让业务语言进入模型（通用语言）、怎么组织实体、聚合和领域事件，防止模型变成大泥球。
- **Ontology 解决的是落地问题**：模型建好之后，怎么让它成为企业里唯一可查询、可操作、可治理的一层——对象类型对应「业务里有什么」，链接对应「怎么连」，动作和函数对应「能对它做什么」，并且带权限、审计和血缘。
- **Palantir 的工程实践里，两者是接上的**：官方 Ontology Governance 那期给出的四条原则——领域驱动设计、不要重复自己、开闭原则、组合优于继承——本身就是 DDD 和面向对象设计的语言；反模式「上帝对象」「动作蔓延」也正是 DDD 要防的问题。

一张对照表（是类比，不是平台功能的一一映射）：

| DDD 概念 | 在 Palantir Ontology 里的对应物 | 说明 |
| --- | --- | --- |
| 通用语言 | 对象类型、属性、关系的命名 | 官方治理视频强调用业务里的名词和动词建模，而不是照搬数仓表名 |
| 实体 / 聚合 | 对象类型 + 链接类型 | 聚合边界靠建模约定，平台不会强制替你划 |
| 领域事件 / 命令 | 事件对象类型 + 动作类型 | 事件本身也建成对象；命令用 Action 执行，可审计、可回写 |
| 限界上下文 | 按业务域组织本体、用接口隔离 | 对应「避免上帝对象、组合优于深层继承」的设计原则 |
| 防腐层 | 数据连接与对象映射层 | 底层表结构不直接暴露给业务对象 |

一句话：**用 DDD 的方法决定「建什么」，用 Ontology 的机制让「建出来的东西」可查询、可执行、可治理。**

## 六、核验说明与筛选标准

- 所有 YouTube 链接通过 oEmbed 或页面元数据核验标题与频道，B 站链接通过公开 API 核验标题、UP 主与时长（2026-11-25）。
- 时长为平台显示值，不同版本可能略有差异；播放量、点赞数未列，避免把热度当成质量。
- 「官方」指 Palantir / Palantir Developers 频道；第三方内容已标注，中文视频多为对官方内容的翻译或解读，版权归原作者，链接可能失效。
- 内容判断基于标题、频道、官方简介与公开目录，未逐一看完全片；建议先看「30 秒结论」里的三个，再按自己的方向补。
