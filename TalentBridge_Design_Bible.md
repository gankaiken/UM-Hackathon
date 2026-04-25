# TalentBridge AI: 终极设计圣经与产品规格 (Design Bible & Product Design Spec)

> **"Technology is the instrument. Dignity is the purpose."**
> 
> 本文档是 TalentBridge AI（基于 Spec V11.1）的终极设计蓝图。它不仅是一份 UI/UX 指南，更是一套连接技术（7-Agent 架构）与人性（B40 候选人尊严）的完整翻译引擎。本文档将指导前端工程师、UI 设计师和产品经理在 Hackathon 及后续开发中实现像素级、体验级的一致性。

---

## 1. 品牌与设计哲学（Brand & Design Philosophy）

TalentBridge 的用户群体处于光谱的两极：一端是可能使用低端安卓手机、网速不稳定、对企业级词汇感到焦虑的 B40 青年；另一端是追求效率、需要深度洞察信号、对数据精度有极高要求的专业 HR。这就要求我们采用独特的 **双极态设计哲学 (Bi-Polar Design Philosophy)**。

### 1.1 核心价值观的视觉表达：Dignity is the Purpose
- **反对“审问感”：** 候选人端杜绝使用倒计时仪、刺眼的红色警告框、冷冰冰的“系统提示”。
- **拥抱“熟悉感”：** 面试界面深度借鉴大马人最熟悉的国民级应用 WhatsApp / Telegram 的对话布局，消除学习成本。
- **透明的主导权：** 绝不向候选人撒谎。我们不提供“伪装成真人的 AI 头像”，而是明确展示 Inquisitor 的 AI 属性，但赋予它最温暖的对话语气。

### 1.2 品牌调性关键词
- **候选人端：** Warm (温暖), Trustworthy (值得信赖), Empowering (赋能), Dignified (体面), Malaysian-friendly (大马亲和力)。
- **HR/雇主端：** Precision (精准), Agentic Power (智能涌现感), Definitive (确定性), Data-dense (高数据密度)。

### 1.3 双核配色系统 (The Bi-Polar Color System)

我们融合了 Airbnb 的“温暖呼吸感”（候选人端）+ Supabase/VoltAgent 的“终极极客感”与 Stripe 的“编辑级优雅”（HR 后台）。

#### 1.3.1 候选人端：The "Warm Canvas" (Inspired by Airbnb / Mastercard)
致力于营造轻松的对话氛围，依靠原生留白和柔和的投影。
*   **Canvas White (背景底色):** `#FAFAFA` (非极白，带有极其微弱的暖意)。
*   **Surface White (卡片/对话框):** `#FFFFFF`。
*   **Inquisitor Bubble:** `#F0F4F8` (极其淡的灰蓝色，冷静但柔和)。
*   **Candidate Bubble:** `#10B981` (Emerald Green 祖母绿的柔和渐变，象征希望与成长，代替常见的紧迫感颜色)。
*   **Text Primary:** `#222222` (Warm Black，绝不用纯黑 `#000000`)。
*   **Text Secondary:** `#6A6A6A`。
*   **Shadow System:** 三层保暖投影 `rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px`。

#### 1.3.2 雇主后台 / HR 端：The "Agentic Terminal" (Inspired by VoltAgent / Stripe)
展示 7-Agent 引擎的精密感，采用 Dark-mode-native。
*   **Void Black (深渊黑背景核心):** `#0F172A` (Slate 900，深空灰蓝调，比纯黑更有高级感)。
*   **Surface Dark (面板层):** `#1E293B` (带 `backdrop-blur-md` 玻片效果)。
*   **Emerald Accent (神经元绿):** `#10B981` (标志性的 Supabase Green，用于高亮、连接线、状态指示灯)。
*   **Stripe Purple (分析紫):** `#6366F1` (Indigo 500，用于深度洞察、Auditor 结论的强调色)。
*   **Typography Accent:** 使用极细、高密集的排版（Weight 300，负字距 `letter-spacing: -0.02em`）。
*   **Border System:** `1px solid rgba(255,255,255,0.08)` 勾勒面板边界，取代大阴影。

### 1.4 排版系统 (Typography System)

*   **Primary Font (UI & Headline):** **Geist** (或 Inter、Sohne-var，若使用开源推荐 `Inter`)。
    *   HR端 Heading 使用 `font-weight: 300`，展现极简奢华；候选人端使用 `font-weight: 500`，显得亲和圆润。
*   **Verbatim/Data Font (等宽/数字):** **Geist Mono** (或 Source Code Pro)。用于 Sentinel 的时间跟踪、Verdict Card 的具体分数。
*   **Manglish/BM/English 混排规则:** 
    *   绝不支持强制纠正拼写引擎。尊重原始输入。
    *   候选人端字号放大：对话内容设定为 `16px` 起步，`line-height: 1.5`，适应长短句混杂的口语表达。

---

## 2. 整体用户旅程地图（User Journey Map）

### 2.1 候选人端 (The Candidate Journey) - 7步蜕变流

| 步骤 | 触点 (Touchpoint) | 用户心理 (User State) | 系统响应 (System Action) | 情感曲线 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 收到链接** | WhatsApp/Email 收到唯一评测邀请链接。 | 好奇、焦虑（"是不是那种无聊的考试？"） | 极简载入，仅需输入名字（无繁琐注册）。 | 平稳 😐 |
| **2. 初次见面** | Inquisitor 发出第一句问候。 | 试探（"我可以用 Manglish 吗？"） | Inquisitor 根据候选人的第一句输入自动语言适配。 | 破冰 🙂 |
| **3. 深入对话** | 第3-5轮，进入具体行为探讨。 | 投入，回忆过去的经验（"其实我那次做得很好"） | Strategist 标记 `DEVELOPING`，追问具体数字和结果。 | 专注 🧐 |
| **4. 意外打断** | 候选人可能因网络或外界切屏。 | 惊慌（"断线了？被判定作弊了？"） | Session 持久化。重连后，无缝加载最后一句。 | 释然 😌 |
| **5. 真实性探针** | 连续切屏触发 Sentinel 软告警。 | 无感知（在正常聊天） | Strategist 发出 `reality_check` 提问，极度自然不显声色。 | 平稳 🤔 |
| **6. 结束会话** | Inquisitor 温和道别，关闭输入框。 | 松一口气，期待结果。 | Auditor 开始后台异步推断，生成 Verdict。 | 期待 🤩 |
| **7. 结果反馈** | 进入终态页面。看到强项、Gap 和路径。 | (如果是 Red) 惊讶但不受辱；(如果是 Amber) 感到被指引。 | 实时渲染极简的成长路径卡片（无打分颜色泄露）。 | 被尊重 🤝 |

### 2.2 雇主端 (The Employer Journey) - 6步决策流

| 步骤 | 触点 (Touchpoint) | 用户心理 (User State) | 系统响应 (System Action) |
| :--- | :--- | :--- | :--- |
| **1. JD 解析** | 粘贴粗糙的招聘广告。 | 疑虑（"这样能招到对的人吗？"） | Mapper 动画：抽丝剥茧提取出 5 个维度和 Probe Targets。 |
| **2. 分发面试** | 复制 Link 放入 Jobstreet / Facebook。 | 期待效率提升。 | 生成带有特定 Role 标签的唯一入口。 |
| **3. 收到报告** | 候选人完成，HR 收到通知。 | "让我看看 AI 挖出了什么"。 | 载入 Dashboard，展示 Verdict Card。 |
| **4. 查看洞察** | 展开 Verdict Card。 | 验证真实性（"这人会不会是 ChatGPT 代写的？"） | 展示 Sentinel 监控记录和 Style Analyzer 评分。 |
| **5. 做出决定** | 点击 Invite / Pass 分类。 | 寻求快速、确定的决策依据。 | 记录 HR 响应时间，更新 HR Reputation Score。 |
| **6. 人才池** | (未来) 浏览正在通过 Amber 路径提升的人才。 | "缺人的时候来这里捞现成的"。 | 展示技能树解锁进度。 |

---

## 3. 页面/组件清单与详细规格（Pages & Components Spec）

### 3.1 候选人端核心页面

#### 3.1.1 欢迎与登录器 (Entry Portal)
*   **布局:** 全屏居中卡片，极端极简 (Airbnb风格)。顶部是企业 Logo 和岗位。
*   **文案:** "Hey there. Ready for your chat for the [Role] position? Just your name to start."
*   **组件:** 一个巨大的、友好的 Input 框。一个软光晕的 Start 按钮。
*   **网络优化 (B40):** 页面原始大小不超过 150KB，背景无大图，使用纯 CSS 暖色渐变。

#### 3.1.2 实时面试聊天域 (The Interview Chat Arena)
*   **布局结构:** 
    *   **Top Bar:** "TalentBridge AI" 标题，带有一个持续跳动的绿点（Signal indicator = Live connection）。
    *   **Chat Viewport:** 垂直滚动区域，隐藏滚动条。
    *   **Input Zone:** 底部固定，宽大的输入框，右侧原生风格的发送纸飞机按钮。
*   **打字机流式特效 (The SSE Magic):** 第一批字符必须在 `< 1000ms` 抵达。文本逐字浮现。但为了消除机器的急躁感，我们在开始渲染前加入一小段 `Typing...` 的 3 个跳动圆点动画（持续 1.5 - 2.5 秒，模拟真人在思考）。
*   **Chat Bubble 设计:** 
    *   候选人 (右侧): `bg-emerald-500 text-white rounded-2xl rounded-br-none shadow-sm`。
    *   Inquisitor (左侧): `bg-slate-100 text-slate-800 rounded-2xl rounded-bl-none shadow-sm`。
*   **无感知网络恢复:** 如果 WebSocket/SSE 掉线，Input 变灰显示 "Reconnecting..."。后台通过 Supabase 恢复。

#### 3.1.3 面试结果揭晓页 (The Feedback Outcome)
严格遵守 Triage 政策：候选人 **永远不看颜色 (Green/Amber/Red)**。
*   **UI 布局:** 
    *   大屏中央："Session Complete. Here is your evaluation."
    *   **Verified Strengths Card:** 带有一个发光的 绿色 Check 图标，用条理清晰的无序列表展示 3 点特长。
    *   **Identified Gap Card:** 温和地指出不足，例如："The system identified an opportunity in structural analytics tool mastery."
    *   **Upskill Path (如果存在):** 呈现为一个带有步骤线（Stepper）的时间轴组件（Week 1, Week 2, Week 3）。
*   **Dispute Button:** 底部的灰色小号文字幽灵按钮: "Think we missed something? Request Human Review".

### 3.2 雇主 / HR 端核心页面

#### 3.2.1 任务指挥中心 / HR Dashboard
这是展示“我们不是套壳 ChatGPT，而是 Agentic 系统”的绝佳地点。
*   **整体风格:** 深色主题 (Dark Mode Native)。满屏的 Void Black 和细细的深灰边框。
*   **Sidebar:** 左侧固定导航。
*   **Main View:** 面试候选人列表 (Data Table)。
    *   采用高密度的表单。
    *   Status 栏有发光的徽章：`Green` (Solid Emerald), `Amber` (Glow Yellow), `Red` (Subdued Rose).
    *   Integrity 栏：显示盾牌图标。如果 Sentinel Stage 2 触发，展示红色的警告小三角。

#### 3.2.2 终极审判卡片 (The Verdict Card Detail View)
点击候选人后唤出的超大侧边抽屉 (Side Drawer) 或独立子页面。
*   **信息架构 (顶到底):**
    1.  **AI Summary:** 将 Auditor 的核心判断用大字号 300 粗细提取在最上方。
    2.  **Dimension Radar / Bars:** 5 个 Mapper 抽出的维度，以水平进度条展示分数。如果 `confidence: low`，进度条呈斑驳虚线样式。
    3.  **The Engine Trace (黑客松必杀技):** 一个可折叠的“调试模式”。打开后：
        *   展示 Strategist 的内部日志、Coverage Map 每轮状态流转。
        *   展示 Style Analyzer 的 5 个信号点雷达和得分。
    4.  **Sentinel Logs:** 时序记录 "04:12 - Tab Switched (>45s)"。
    5.  **Action Bar:** 悬浮在底部的 "Invite", "Reject", "Waitlist"。

#### 3.2.3 HR Reputation Badge
在 Header 右上角，一个圆环进度条（类似 Apple Watch 的健身环）。展示 "92% Response Rate | 14h Avg Time"。

---

## 4. 核心功能交互细节（Interaction Design Bible）

### 4.1 Inquisitor 流式打字 (SSE Streaming) 细节
1. **网络级传输:** 后端收到 Strategist JSON 后，立刻启动 GLM-4 的流式输出。
2. **防跳动处理 (Anti-Jitter):** 不要一收到 chunk 就直接更新 DOM 导致页面剧烈抖动。引入一个微小的请求队列缓冲区（Queue Buffer）。
3. **滚动锚定 (Scroll Anchoring):** 当 Inquisitor 文字不断输出换行时，自动平滑地将屏幕 `scrollTop` 锁定在最低端，确保用户永远看到最新输入的字，不要使用生硬的 `scrollIntoView`。

### 4.2 Sentinel 前端监控的不打扰哲学
*   Sentinel **不能** 在前端弹出 "你切屏了！" 的警告抓现行。这会破坏 Dignity 原则。
*   **如何做视觉反馈（可选创意）:** 当探测到剪贴板有大段粘贴（`paste_events > 1`）时，Input 输入框的边框闪烁极其微弱的红光（持续 300ms 消失），用户可能注意不到，但这就暗示“系统察觉了”。
*   后台代码实现（Vanilla JS）：
```javascript
// Sentinel Core Tracker
let focusLossCount = 0;
let lastBlurTime = 0;
let totalAwayTime = 0;
let pasteEvents = 0;

window.addEventListener('blur', () => { lastBlurTime = Date.now(); });
window.addEventListener('focus', () => {
    if(lastBlurTime > 0) {
        let awayDuration = (Date.now() - lastBlurTime) / 1000;
        totalAwayTime += awayDuration;
        focusLossCount++;
        // Emit payload to Sentinel Channel
    }
});
document.addEventListener('paste', (e) => {
    const pasteTxt = (e.clipboardData || window.clipboardData).getData('text');
    if(pasteTxt.length > 150) pasteEvents++; // Only track massive pastes
});
```

### 4.3 Verdict Card 的展示动画
当 HR 打开 Verdict Card 时，不要让所有数据一下“duang”地出现。
使用依次点亮的序列动画 (Staggered Animation)：
1.  **AI Summary 淡入** (0ms)
2.  **Sentinel 防欺诈状态印章“盖下”** (400ms，带微小震动)
3.  **Dimension 进度条从 0 冲刺到得分** (600ms - 1200ms)
4.  **最终颜色 Triage Badge 点亮发光** (1400ms)
这会给评委极强的“高算力运算刚得出的结果”的视觉快感。

---

## 5. 视觉设计系统（Design System - Tailwind & UI Spec）

这里提供针对开发时的 Tailwind / CSS 参考规范底座。

### 5.1 候选人端 (Candidate UI Kit)
*   **Chat Container:** `max-w-2xl mx-auto min-h-[85vh] bg-[#FAFAFA] flex flex-col`
*   **System Input Wrapper:** `sticky bottom-0 w-full px-4 pt-2 pb-6 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA] to-transparent`
*   **Textarea:** `w-full rounded-3xl bg-white border border-gray-200 px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none shadow-[...三层柔和阴影]`
*   **Typography:** `font-medium text-[16px] text-[#222222] leading-relaxed`

### 5.2 雇主端 (HR Dark Terminal UI Kit)
*   **App Background:** `bg-[#0F172A] text-slate-50`
*   **Card Container:** `bg-[#1E293B] border border-slate-700/50 rounded-xl` (绝不使用重度投影)
*   **Agentic Line Indicator (连线连接各卡片):** `border-l-2 border-dashed border-slate-600 ml-[11px]`
*   **Heading:** `text-2xl font-light tracking-[-0.02em]` (Sohne-var / Geist 300 效果)
*   **Monospace Pill (例如显示 UUID 或耗时):** `font-mono text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded`
*   **Status Badges:**
    *   *Green Check:* `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
    *   *Amber Revise:* `bg-amber-500/10 text-amber-400 border border-amber-500/20`
    *   *Red Alert:* `bg-rose-500/10 text-rose-400 border border-rose-500/20`

---

## 6. Hackathon Demo 优化建议（金牌策略 🏆）

为了在 Demo Day 让多位领域专家的下巴掉下来，你需要把技术架构（Spec V11.1）进行极富张力的戏剧化演绎。

### 6.1 MoSCoW 执行优先级 (参考 Spec Chapter 14)
*   **必须跑通 (Must Have):** Mapper 提维 -> Strategist / Inquisitor 流式聊天 -> Sentinel 前台拦截 -> Auditor 生成 JSON 并在 HR 后台展示。这段前后端联动是根本。
*   **决胜点 (Should Have):** **The Engine Trace / Debug Terminal**。在 HR 端放一个小按钮 `[< > Open Agent Trace]`，点开后能看到 Strategist 每回合大脑是怎么“自言自语”的 (即输出 JSON 中的 `reasoning` 字段)。这是绝杀。
*   **绝对不要浪费时间做 (Won't Have):** 找回密码、各种企业 Logo 居中对齐、多层级角色权限管理、PDF 简历解析引擎（完全无关痛痒）、复杂的结算计费系统页面。

### 6.2 黄金 4 分钟的 Hackathon Demo 剧本路线

**[0:00 - 0:45] 情感锚定与问题切入 (The Hook)**
一张黑底 PPT，一句巨大白字：“Last year, 200,000 young Malaysians spoke to the void and heard nothing back. Silence is not an HR strategy.” 随后提出 “The First Dignity-Driven, Agentic Hiring Hub.”

**[0:45 - 2:00] 惊人的 Demo 上半场：AI vs Human 真实防守**
*   **操作:** 直接手机扫码进入聊天。你开始随意输入一短句 Manglish。Inquisitor 用亲切的 Manglish 热烈回复。
*   **高潮点:** 你开始演示**“试图作弊”**。你切屏，停留了十秒，然后粘贴一大段“ChatGPT 风格”的回答（"Furthermore, my strategic marketing initiatives..."）。
*   **系统反应:** 你打开屏幕侧边隐藏的观测台，评委肉眼看到：
    `[Sentinel Stage 2 Triggered] -> [Style Analyzer Awoken] -> [Strategist priority = 'reality_check']`
*   由于你的行为，“面试官” Inquisitor 表面依旧温和，但突然抛出一个刺骨的细节问题：“Wow that's comprehensive. But what was the VERY FIRST product you posted on that TikTok account that day?”
*   *【此处可停顿，看着评委微笑：“It's not a chatbot. It's a polygraph draped in velvet.” (这不是聊天机器人，这是披着天鹅绒的测谎仪)】*

**[2:00 - 3:00] 后台展示：不是一套 Prompt，是一个引擎流水线**
*   切换到 HR 端 Dashboard。打开刚形成的 Verdict Card。
*   展示它不仅仅给出了分数，还展示了 Auditor 自动剥离偏见的操作，以及给出的 Upskill Path (针对 Amber 候选人)。
*   指出 Schema Validator 是纯防错代码层。

**[3:00 - 3:45] 绝杀一击：通用可扩展引擎 (The Extensibility Blow)**
*   放出本文档所增加的那张通用扩展的 PPT ("The Engine Behind TalentBridge")。
*   **台词:** “The 7-layered architecture evaluating this candidate can evaluate Healthcare Triage, Loan Risks, or Customer Disputes tomorrow. It extracts, reasons, probes, monitors, and audits. We just chose hiring today, because those 200,000 B40 youths deserved to be first.”

**[3:45 - 4:00] Q&A 预警部署**
*   **Q:** “你怎么保证它不用英文面试有偏见？”
    **A:** 打开 Auditor 的系统 Prompt (预备在 VSCode 里展示) —— "Look at lines 15-20. We explicitly hardcoded bias-stripping constraints against grammar, slang, and response time."
*   **Q:** “成本呢？”
    **A:** “By heavily caching the Mapper, decoupling the Auditor, and running the Sentinel entirely in zero-token vanilla JS, a 20-turn interview costs exactly RM 1.20 in GLM-4 tokens natively. Cheaper than a cup of Kopi-O.”

---

## 7. 技术实现提示（Prompt 给未来的开发版 Claude / 程序员助手）

如果你要把这个规格完全用代码跑起来，请向你的 Code Assistant 下达以下指令纲要：

### 7.1 前端工程建议 (Next.js 14 App Router + TailwindCSS)
*   构建 **Chat 页面**：重点使用 React 的 `useRef` 实现到底部的 auto-scroll。
*   利用 `Edge Runtime` 处理 SSE 接口路由，不要用 Serverless Node.js 避免由于时间超出限制导致断开。
*   对 Sentinel 检测出的数据使用 Zustand 极其轻量的状态管理：`useSentinelStore(state => state.incrementFocusLoss)`，然后每个回合携带在提交包里发给服务端。
*   使用 **Framer Motion** 实现气泡渐入效果：
    `<motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} />`

### 7.2 后端通信工程建议 (Agent 协调管道)
*   **Supabase 架构:** 
    *   两张神表：`sessions` (记录面试宏观数据、Mapper JSON 副本、当前 Triage 状态)；`turns` (记录每一轮对话的话术、发出者、Sentinel Metadata、以及 Strategist 的 Reasoning JSON 副本)。
    *   **RLS (Row Level Security):** 极其重要。由于候选人是免登陆的匿名用户（通过 UUID session link），因此必须设置 RLS policies，使得该 UUID 只能 INSERT 对话并 SELECT 它自己的对话历史。避免被人用 API 遍历拉走所有人的面试数据！
*   **API 结构:** 一个核心路由 `/api/chat`。候选人 POST 一句话上来。
    1. 获取上下文。
    2. 将上下文送入 GLM-4 (调用 `Strategist` 模型)。
    3. 解析出 JSON（使用 Zod / Joi 验证 `next_action`, `probe_angle` 出错 fallback 处理）。
    4. 携带着 `probe_angle` 启动第二重 GLM-4 流式调用 (`Inquisitor` 模型)。
    5. 返回 ReadableStream。整个过程无缝衔接。

### 7.3 Schema Validation 纯代码层的实现 (Validator)
不用让 AI 检查自己。用纯 TypeScript 检验 Auditor 的结论是否合法：
```typescript
function validateAuditorOutput(verdict: VerdictResult, mapper: MapperJSON, sentinel: SentinelStats) {
  // 1. Array completeness check
  const hasAllDims = mapper.core_dimensions.every(d => !!verdict.dimension_scores[d]);
  if(!hasAllDims) throw new Error("Missing dimensions");
  
  // 2. Logical consistency checks
  if(verdict.triage_result === "AMBER" && (!verdict.upskill_path || verdict.upskill_path.length === 0)) {
     throw new Error("Amber must have upskill plan");
  }
  if(verdict.triage_result === "RED" && verdict.upskill_path) {
     throw new Error("Red must NOT contain upskill plan");
  }
  
  // 3. Sentinel fallback check
  if(sentinel.focus_loss_events > 3 && sentinel.paste_events > 1 && !verdict.human_review_required) {
     throw new Error("Sentinel threshold breached, but human_review_required was false");
  }
  
  return true;
}
```

---

## 8. 一点“加分超限战”创意补充 (Creative Expanders)

站在高级产品思维和 UX 体验的角度，为这个系统引入最后三个 **"Wow Factors"**：

1.  **“Manglish-native” 的情感分析仪表：** 在 HR 的后台里，不只是列出冰冷的分数，给出一个 **"Authenticity Heatmap" (真实感热力图)**。当候选人说话最放松、用本地俚语讲具体业务数据的那一段，热力图最红。向评委展示：AI 开始理解本地文化中的真诚感。
2.  **雇主的 JD “反向诊断” 动画：** 在雇主刚粘贴上烂到不行的 JD，等待 Mapper 解析的那三秒钟，不要放一个无聊的 Loading Spinner。放这几句话滚动："Scanning corporate jargon..." -> "Stripping generic requirements..." -> "Extracting behavioral signals..."。这让系统变得极度内行且充满人格魅力。
3.  **防伪水印的 Verdict Card Export：** 提供一个 PDF 导出按钮。在 Verdict Card 上打上唯一的加密散列值 (Hash ID) 防篡改证明，向外声明：“由 TalentBridge 验证，此报告不可被候选人/HR 私自修改”。直接拉高整个平台的权威信任背书。

---

> 此文档已完备。现在，无论是送给 LLM 写代码，还是送给 UI 做界面，一切都已定义清晰。祝你在 Hackathon 中取得金牌 — **Your narrative, your architecture, and your cause are unstoppable.**
