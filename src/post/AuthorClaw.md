## 简介

AuthorClaw 是一款**安全加固的 AI 写作助手，**专为小说和非小说类作家打造。它是一个基于 Node.js 的应用程序，能够协调多个 AI 提供商，自主执行多步骤写作工作流程。用户可通过三种主要界面进行交互：Web 控制面板（单页应用）、REST API 或 Telegram 机器人。

有关特定子系统的详细信息：

- 网关服务编排：[网关服务](https://deepwiki.com/Ckokoski/authorclaw/3.1-gateway-service)
- 安全实施细节：[安全架构](https://deepwiki.com/Ckokoski/authorclaw/3.3-security-architecture)
- AI提供商集成：[AI集成](https://deepwiki.com/Ckokoski/authorclaw/6-ai-integration)
- 项目执行工作流程：[项目引擎](https://deepwiki.com/Ckokoski/authorclaw/5-project-engine)
- 自主运行：[自主模式](https://deepwiki.com/Ckokoski/authorclaw/7-autonomous-mode)

## 系统架构

AuthorClaw 遵循以类为中心的**服务定位器模式**`AuthorClawGateway`，该类负责初始化并提供对所有核心服务的访问。网关处理 HTTP、WebSocket 和桥接连接，并在请求到达业务逻辑之前，将其路由到安全边界。

## AuthorClawGateway 核心类

### *constructor*构造函数

```ts
this.app = express();// 创建 Express 应用实例。
this.server = createServer(this.app); // 把 Express 挂到 Node 的 HTTP Server 上（后面可给 Socket.IO 共用）
// 在同一个 HTTP Server 上启用 WebSocket，并且只允许前端地址 http://localhost:3847 和 http://127.0.0.1:3847 连接。
this.io = new SocketIO(this.server, {
  cors: { origin: ['http://localhost:3847', 'http://127.0.0.1:3847'] },
}); 

// 自动设置一组安全相关响应头（防 XSS、点击劫持等）。
// contentSecurityPolicy.directives：显式定义 CSP 白名单：
// defaultSrc: ['self']：默认资源只允许同源。
// scriptSrc/styleSrc 加了 'unsafe-inline'：允许内联脚本/样式（方便开发，但安全性偏弱）。
// connectSrc 允许同源 + 本地前端地址：允许页面向这些地址发起 XHR/fetch/WebSocket 连接。

this.app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "http://localhost:3847", "http://127.0.0.1:3847"],
    },
  },
}));
//cors({ origin: [...] })：HTTP 接口层面的跨域白名单（和上面的 CSP 不是一回事，两者都可能影响请求）。
this.app.use(cors({ origin: ['http://localhost:3847', 'http://127.0.0.1:3847'] }));
this.app.use(express.json({ limit: '5mb' })); // 解析 JSON 请求体，最大 5MB，超过会报错（防止超大 payload）。
```

::: tip

这是Socket.IO集成的标准流程

```ts
this.server = createServer(this.app);
this.io = new SocketIO(this.server, {
  cors: { origin: ['http://localhost:3847', 'http://127.0.0.1:3847'] },
});
```

- this.app 是 Express 应用（本质是一个请求处理函数）。
- createServer 会创建 Node 的原生 http.Server，把所有 HTTP 请求先交给 Express 处理。
- 结果赋值给 this.server，后面可以 listen(port) 启动。
- Socket.IO 不是单独再开一个端口，而是挂载到同一个 http.Server。
- 这样同一个端口既能处理普通 HTTP API，也能处理 WebSocket/轮询升级。
- 优点：部署简单（一个端口）、共享会话/中间件更方便、反向代理配置更统一。

:::

### start方法

程序运行时直接调用start方法

- 先初始化方法initialize
- 从配置中获取端口
- 启动http和socket服务

```ts
async start(): Promise<void> {
  await this.initialize();
  const port = this.config.get('server.port', 3847);
  this.server.listen(port, '127.0.0.1', () => {
    // Bound to localhost only for security
  });
}

```

### initialize

整体作用

- 按依赖顺序启动系统（配置 -> 安全 -> AI -> 功能模块 -> 对外接口）
- 每一步成功就打印状态，失败点主要做降级（例如某些可选功能失败不阻塞主流程）
- 启动后进入“持续运行”状态（心跳任务、桥接消息、Web 服务）

```ts
  async initialize(): Promise<void> {
    console.log('');
    console.log('  ✍️  AuthorClaw v3.0.0');
    console.log('  ═══════════════════════════════════');
    console.log('  The Autonomous AI Writing Agent');
    console.log('  An OpenClaw fork for authors');
    console.log('');

    // ── Phase 1: Configuration ── 配置加载
    this.config = new ConfigService(join(ROOT_DIR, 'config'));
    await this.config.load(); // 异步加载config配置文件到内存。主要包括端口、模型、渠道配置
    console.log('  ✓ Configuration loaded');

    // ── Phase 2: Security Layer ── 安全层。
    this.vault = new Vault(join(ROOT_DIR, 'config', '.vault')); // 创建加密保险库 Vault，路径 config/.vault。
    await this.vault.initialize();
    console.log('  ✓ Encrypted vault initialized (AES-256-GCM)');
		// 根据配置 security.permissionPreset 创建权限管理器，默认 standard。
    this.permissions = new PermissionManager(this.config.get('security.permissionPreset', 'standard'));
    console.log(`  ✓ Permissions: ${this.permissions.preset} mode`);
		// 创建审计日志服务，目录 workspace/.audit
    this.audit = new AuditLog(join(ROOT_DIR, 'workspace', '.audit'));
    await this.audit.initialize();
    console.log('  ✓ Audit logging active');
		// 创建沙箱守卫，仅允许工作区文件访问。
    this.sandbox = new SandboxGuard(join(ROOT_DIR, 'workspace'));
    console.log('  ✓ Sandbox: workspace-only file access');
		// 创建注入检测器（提示词注入防护）。
    this.injectionDetector = new InjectionDetector();
    console.log('  ✓ Prompt injection detection active');

    // ── Phase 2b: Activity Log ── 活动日志
		// 创建活动日志服务，根路径 workspace。
    this.activityLog = new ActivityLog(join(ROOT_DIR, 'workspace'));
    await this.activityLog.initialize(); // 初始化活动日志。
    console.log('  ✓ Activity log initialized');

    // ── Phase 3: Soul & Memory ──  Soul 与记忆
		// 创建 SoulService，目录 workspace/soul。
    this.soul = new SoulService(join(ROOT_DIR, 'workspace', 'soul'));
    await this.soul.load(); // 加载 soul 数据。
    console.log(`  ✓ Soul loaded: "${this.soul.getName()}"`);
		// 创建 MemoryService，目录 workspace/memory，并传入内存配置。
    this.memory = new MemoryService(join(ROOT_DIR, 'workspace', 'memory'), this.config.get('memory'));
    await this.memory.initialize(); // 初始化记忆系统。
    console.log('  ✓ Memory system initialized');

    // ── Phase 4: AI Providers ── 
		// 创建成本追踪器 CostTracker，传入 costs 配置。
    this.costs = new CostTracker(this.config.get('costs'));
    console.log(`  ✓ Budget: $${this.costs.dailyLimit}/day, $${this.costs.monthlyLimit}/month`);
		// 创建 AIRouter（AI 配置 + vault + cost tracker）。
    this.aiRouter = new AIRouter(this.config.get('ai'), this.vault, this.costs);
		// 初始化 AI 路由（检查 provider 可用性等）。
    await this.aiRouter.initialize();
		// 获取当前激活 provider 列表。
    const providers = this.aiRouter.getActiveProviders();
    for (const p of providers) {
      const tier = p.tier === 'free' ? '🆓 FREE' : p.tier === 'cheap' ? '💰 CHEAP' : '💎 PAID';
      console.log(`  ✓ AI: ${p.name} (${p.model}) — ${tier}`);
    }

    // ── Phase 5: Research Gate ── 研究白名单阶段。
    this.research = new ResearchGate(
      join(ROOT_DIR, 'config', 'research-allowlist.json'),
      this.audit
    );
    await this.research.initialize(); // 读取配置文件中白名单域名
    console.log(`  ✓ Research gate: ${this.research.getAllowedDomainCount()} approved domains`);

    // ── Phase 6: Skills ── 技能加载阶段。
		// 创建 SkillLoader（skills 目录 + 权限管理器）。
    this.skills = new SkillLoader(join(ROOT_DIR, 'skills'), this.permissions);
    await this.skills.loadAll(); // 加载所有技能。
    const premiumCount = this.skills.getPremiumSkillCount();// 获取会员skill数量
    const premiumLabel = premiumCount > 0 ? `, ${premiumCount} premium ★` : '';
    console.log(`  ✓ Skills: ${this.skills.getLoadedCount()} loaded (${this.skills.getAuthorSkillCount()} author-specific${premiumLabel})`);

    // ── Phase 6a: Auto-generate SKILLS.txt reference file ── 自动生成 SKILLS.txt
    try {
      const skillsRefPath = join(ROOT_DIR, 'workspace', 'SKILLS.txt'); // 目标路径
      const catalog = this.skills.getSkillCatalog(); // 获取所有的技能列表
      const byCategory = this.skills.getSkillsByCategory(); // 按类型给skill分组
      let refContent = 'AUTHORCLAW SKILLS REFERENCE\n';
      refContent += `Auto-generated on startup — ${catalog.length} skills loaded\n`;
      refContent += '═'.repeat(60) + '\n\n';
      // 按固定分类顺序遍历：
      for (const category of ['core', 'author', 'marketing', 'premium']) {
        const skills = byCategory[category]; // 取该分类技能列表。
        if (!skills || skills.length === 0) continue;

        const label = category.charAt(0).toUpperCase() + category.slice(1); // 首字母大写分类名
        const extra = category === 'premium' ? ' ★' : ''; // premium 分类加星标。
        // 写分类标题行。── Core Skills (4) ──
        refContent += `── ${label} Skills (${skills.length})${extra} ──\n\n`;
        // 遍历该分类每个技能。
        for (const skill of skills) {
          // 在目录中找对应条目（为了拿触发词）。
          const catalogEntry = catalog.find(c => c.name === skill.name); 
          const triggers = catalogEntry?.triggers?.join(', ') || ''; // 拼触发关键词字符串。
          refContent += `  ${skill.name}\n`; // 写技能名
          refContent += `    ${skill.description}\n`; // 写技能描述。
          if (triggers) refContent += `    Keywords: ${triggers}\n`; // 如果有触发词时写 Keywords
          refContent += '\n'; 
        }
      }
      // 写入 SKILLS.txt。
      await fs.writeFile(skillsRefPath, refContent, 'utf-8');
      console.log(`  ✓ SKILLS.txt auto-updated (${catalog.length} skills)`);
    } catch (e) {
      console.log(`  ⚠ Failed to update SKILLS.txt: ${e}`);
    }

    // ── Phase 6b: Author OS Tools ── Author OS 工具
    // Check multiple locations: Docker mount, env var, home dir, or relative to project
    // 取 home 目录（兼容不同系统环境变量）。
    const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
    // 构造候选路径数组并过滤空值：
    // Docker: /app/author-os
    // 环境变量路径
    // ~/author-os
    // 与项目同级 Author OS
    // 上两级 Author OS
    const authorOSCandidates = [
      '/app/author-os',                                           // Docker
      process.env.AUTHOR_OS_PATH || '',                           // Explicit env var
      join(homeDir, 'author-os'),                                 // ~/author-os (VM)
      join(ROOT_DIR, '..', 'Author OS'),                          // Sibling to AuthorClaw project
      join(ROOT_DIR, '..', '..', 'Author OS'),                    // Automations/Author OS/
    ].filter(Boolean);
    // 找第一个存在路径；若都不存在用默认候选（~/author-os）。
    const authorOSPath = authorOSCandidates.find(p => existsSync(p)) || authorOSCandidates[2];
    this.authorOS = new AuthorOSService(authorOSPath); //创建 AuthorOSService。
    await this.authorOS.initialize(); // 初始化 Author OS。查询目录
    const osTools = this.authorOS.getAvailableTools(); // 获取有效的目录
    if (osTools.length > 0) {
      console.log(`  ✓ Author OS: ${osTools.length} tools (${osTools.join(', ')})`);
    } else {
      console.log('  ⚠ Author OS: no tools found (mount to /app/author-os or ~/author-os)');
    }

    // ── Phase 6c: TTS Service (Piper) — silent init, optional feature ── 
    // TTS、图像、角色、项目引擎
    this.tts = new TTSService(join(ROOT_DIR, 'workspace')); // 创建 TTSService（workspace）。
    await this.tts.initialize(); // 初始化 TTS。

    // ── Phase 6c2: Image Generation Service ── 图像生成服务
    // 创建 ImageGenService（workspace + vault）。
    this.imageGen = new ImageGenService(join(ROOT_DIR, 'workspace'), this.vault); 
    await this.imageGen.initialize(); //初始化图像生成服务。

    // ── Phase 6d: Author Personas ── 作者
    this.personas = new PersonaService(join(ROOT_DIR, 'workspace')); //创建 PersonaService。
    await this.personas.initialize(); // 初始化 persona。
    console.log(`  ✓ Personas: ${this.personas.getCount()} author persona(s) loaded`);

    // ── Phase 6e: Project Engine ──  项目引擎。
    // 创建 ProjectEngine（AuthorOS + ROOT_DIR）。
    this.projectEngine = new ProjectEngine(this.authorOS, ROOT_DIR); 
    // Wire AI capabilities for dynamic planning
    // 注入 AI 能力。
    this.projectEngine.setAI(
      (request) => this.aiRouter.complete(request),
      (taskType) => this.aiRouter.selectProvider(taskType)
    );
    // 读取项目模板列表。
    const templates = this.projectEngine.getTemplates();
    console.log(`  ✓ Project engine: ${templates.length} templates + dynamic AI planning`);

    // ── Phase 7: Heartbeat ──  Heartbeat 与自治逻辑注入
    // 创建 HeartbeatService（heartbeat 配置 + memory）。
    this.heartbeat = new HeartbeatService(this.config.get('heartbeat'), this.memory);

    // Wire autonomous mode — heartbeat can now trigger project steps on a schedule
    // 构建 Telegram 命令处理器。
    const commandHandlers = this.buildTelegramCommandHandlers();
    // 调用 heartbeat.setAutonomous(...)，传入多个能力回调。
    this.heartbeat.setAutonomous(
      // Run one project step (reuses the same logic as Telegram /project command)
      // 执行一个项目步骤
      async (projectId: string) => commandHandlers.startAndRunProject(projectId),
      // List projects with remaining step counts
      // 列出项目状态
      // 返回项目摘要列表（id、标题、状态、进度、剩余步骤、类型）。
      () => this.projectEngine.listProjects().map(g => ({
        id: g.id,
        title: g.title,
        status: g.status,
        progress: `${g.progress}%`,
        progressNum: g.progress,
        stepsRemaining: g.steps.filter(s => s.status === 'pending' || s.status === 'active').length,
        type: g.type,
      })),
      // Broadcast status to dashboard (WebSocket) and Telegram
      // 广播自治状态
      (message: string) => {
        this.io.emit('autonomous-status', { message, timestamp: new Date().toISOString() });
        if (this.telegram) {
          this.telegram.broadcastToAllowed?.(message);
        }
      },
      // Self-improvement analysis callback
      // 自我改进分析（关键逻辑）
      async (projectId: string) => {
        const project = this.projectEngine.getProject(projectId);
        if (!project) return null;

        // Read the last completed step results for analysis
        const completedSteps = project.steps
          .filter((s: any) => s.status === 'completed' && s.result)
          .slice(-10);

        if (completedSteps.length === 0) return null;

        const sampleText = completedSteps
          .map((s: any) => `### ${s.label}\n${(s.result || '').substring(0, 1500)}`)
          .join('\n\n');

        try {
          const provider = this.aiRouter.selectProvider('general');
          const result = await this.aiRouter.complete({
            provider: provider.id,
            system: 'You are a writing coach analyzing completed manuscript output. Be specific and actionable.',
            messages: [{
              role: 'user' as const,
              content: `Analyze this writing from the completed project "${project.title}". Identify:\n\n` +
                `1. 3-5 actionable insights for improving future writing\n` +
                `2. 2-3 specific strengths to maintain\n` +
                `3. 2-3 specific weaknesses to address\n\n` +
                `Return ONLY valid JSON: {"insights":["..."],"strengths":["..."],"weaknesses":["..."]}\n\n` +
                `Writing samples:\n\n${sampleText}`,
            }],
          });

          // Parse AI response
          const cleaned = result.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
          const parsed = JSON.parse(cleaned);

          // Save to self-improve log
          const workspaceDir = join(ROOT_DIR, 'workspace');
          const agentDir = join(workspaceDir, '.agent');
          await fs.mkdir(agentDir, { recursive: true });
          const logPath = join(agentDir, 'self-improve-log.json');
          let log: any[] = [];
          try {
            if (existsSync(logPath)) {
              log = JSON.parse(await fs.readFile(logPath, 'utf-8'));
            }
          } catch { /* start fresh */ }

          log.push({
            projectId,
            projectTitle: project.title,
            timestamp: new Date().toISOString(),
            ...parsed,
          });

          // Keep last 50 entries
          if (log.length > 50) log = log.slice(-50);
          await fs.writeFile(logPath, JSON.stringify(log, null, 2), 'utf-8');

          this.activityLog.log({
            type: 'system',
            source: 'internal',
            goalId: projectId,
            message: `Self-improvement analysis saved: ${parsed.insights?.length || 0} insights`,
            metadata: { insights: parsed.insights?.length, strengths: parsed.strengths?.length },
          });

          // ── Core Lessons Consolidation ──
          // Every 5 entries, distill ALL insights into a persistent "Core Lessons" file.
          // This prevents old improvements from being forgotten as new ones are added.
          // Core Lessons get injected into future project system prompts.
          if (log.length % 5 === 0 && log.length >= 5) {
            try {
              const allInsights = log.flatMap((l: any) => l.insights || []);
              const allStrengths = log.flatMap((l: any) => l.strengths || []);
              const allWeaknesses = log.flatMap((l: any) => l.weaknesses || []);

              const consolidateResult = await this.aiRouter.complete({
                provider: provider.id,
                system: 'You are a writing coach creating a persistent learning document. Distill patterns from many observations into timeless, actionable principles. Remove duplicates. Keep the most important lessons. Be concise — each lesson should be 1-2 sentences max.',
                messages: [{
                  role: 'user' as const,
                  content: `Consolidate these observations from ${log.length} completed writing projects into Core Lessons.\n\n` +
                    `ALL INSIGHTS:\n${allInsights.map((i: string, n: number) => `${n + 1}. ${i}`).join('\n')}\n\n` +
                    `ALL STRENGTHS:\n${allStrengths.map((s: string, n: number) => `${n + 1}. ${s}`).join('\n')}\n\n` +
                    `ALL WEAKNESSES:\n${allWeaknesses.map((w: string, n: number) => `${n + 1}. ${w}`).join('\n')}\n\n` +
                    `Create a concise Core Lessons document with these sections:\n` +
                    `1. TOP PRINCIPLES (5-7 most important writing lessons learned)\n` +
                    `2. PROVEN STRENGTHS (3-5 things to keep doing)\n` +
                    `3. RECURRING WEAKNESSES (3-5 things to actively avoid)\n` +
                    `4. STYLE NOTES (any consistent voice/style observations)\n\n` +
                    `Write in second person ("You tend to..." / "Your strength is..."). Be specific and actionable. Max 500 words total.`,
                }],
              });

              const coreLessonsPath = join(agentDir, 'core-lessons.md');
              const coreLessonsContent = `# AuthorClaw Core Lessons\n\n` +
                `*Auto-consolidated from ${log.length} project analyses on ${new Date().toISOString().split('T')[0]}*\n\n` +
                consolidateResult.text;
              await fs.writeFile(coreLessonsPath, coreLessonsContent, 'utf-8');
              console.log(`  🧠 Core Lessons consolidated from ${log.length} analyses`);
            } catch (consolidateErr) {
              console.log(`  ⚠ Core Lessons consolidation failed: ${consolidateErr}`);
            }
          }

          return parsed;
        } catch {
          return null;
        }
      },
      // Follow-up project creation for completed novel pipelines
      // 小说流水线完成后自动创建后续项目
      async (originalProjectId: string, originalTitle: string, originalType: string) => {
        if (originalType !== 'novel-pipeline') return null;

        const followUpTitle = `Polish & Publish: ${originalTitle}`;
        const followUpDesc = `Follow-up tasks after completing the first draft of "${originalTitle}". ` +
          `Prepare for beta readers, write query letter, create synopsis.`;

        const project = this.projectEngine.createProject('book-launch', followUpTitle, followUpDesc, {
          parentProjectId: originalProjectId,
          parentTitle: originalTitle,
          autoCreated: true,
        });

        this.activityLog.log({
          type: 'project_created',
          source: 'internal',
          goalId: project.id,
          message: `Auto-created follow-up project: "${followUpTitle}"`,
          metadata: { parentProjectId: originalProjectId, steps: project.steps.length },
        });

        return project.id;
      },
      // Idle task: run configurable author-focused tasks when no projects are active
      // Loads tasks from workspace/.config/idle-tasks.json (user-editable via dashboard)
      // 空闲任务执行器
      async () => {
        // Load tasks from config file, falling back to defaults
        const idleConfigPath = join(ROOT_DIR, 'workspace', '.config', 'idle-tasks.json');
        let idleTasks: Array<{ label: string; prompt: string; enabled?: boolean }> = [];
        try {
          if ((await import('fs')).existsSync(idleConfigPath)) {
            const raw = await fs.readFile(idleConfigPath, 'utf-8');
            const parsed = JSON.parse(raw);
            idleTasks = (parsed.tasks || []).filter((t: any) => t.enabled !== false);
          }
        } catch { /* fall through to defaults */ }

        if (idleTasks.length === 0) {
          idleTasks = (await import('./services/idle-tasks-defaults.js')).DEFAULT_IDLE_TASKS;
          // Save defaults on first run
          try {
            const configDir = join(ROOT_DIR, 'workspace', '.config');
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(idleConfigPath, JSON.stringify({ tasks: idleTasks }, null, 2), 'utf-8');
          } catch { /* non-fatal */ }
        }

        if (idleTasks.length === 0) return null;

        // Pick a random task
        const task = idleTasks[Math.floor(Math.random() * idleTasks.length)];

        try {
          const provider = this.aiRouter.selectProvider('general');
          const result = await this.aiRouter.complete({
            provider: provider.id,
            system: 'You are AuthorClaw, an AI writing agent for authors. Be detailed, actionable, and expert-level.',
            messages: [{ role: 'user' as const, content: task.prompt }],
            maxTokens: 2000,
          });

          if (result.text && result.text.length > 20) {
            // Save to workspace
            const idleDir = join(ROOT_DIR, 'workspace', '.agent');
            await fs.mkdir(idleDir, { recursive: true });
            const dateStr = new Date().toISOString().split('T')[0];
            await fs.writeFile(
              join(idleDir, `idle-${dateStr}.md`),
              `# ${task.label}\n*Generated ${new Date().toISOString()}*\n\n${result.text}`,
              'utf-8'
            );

            this.activityLog.log({
              type: 'system',
              source: 'internal',
              message: `Idle task: ${task.label}`,
              metadata: { taskType: task.label },
            });

            return `${task.label}: ${result.text.substring(0, 200)}`;
          }
          return null;
        } catch {
          return null;
        }
      }
    );
    // 启动 Heartbeat
    this.heartbeat.start();
    const autonomousLabel = this.config.get('heartbeat.autonomousEnabled')
      ? ` + autonomous every ${this.config.get('heartbeat.autonomousIntervalMinutes', 30)}min`
      : '';
    console.log(`  ✓ Heartbeat: every ${this.config.get('heartbeat.intervalMinutes', 15)} minutes${autonomousLabel}`);

    // ── Phase 8: Bridges ── 外部桥接
    if (this.config.get('bridges.telegram.enabled')) {
      const token = await this.vault.get('telegram_bot_token');
      if (token) {
        this.telegram = new TelegramBridge(token, this.config.get('bridges.telegram'));
        this.telegram.onMessage((content, channel, respond) =>
          this.handleMessage(content, channel, respond)
        );
        this.telegram.setCommandHandlers(commandHandlers);
        await this.telegram.connect();
        console.log('  ✓ Telegram bridge connected (command center mode)');
      } else {
        console.log('  ⚠ Telegram enabled but no token in vault');
      }
    }

    if (this.config.get('bridges.discord.enabled')) {
      const token = await this.vault.get('discord_bot_token');
      if (token) {
        this.discord = new DiscordBridge(token, this.config.get('bridges.discord'));
        await this.discord.connect();
        console.log('  ✓ Discord bridge connected');
      } else {
        console.log('  ⚠ Discord enabled but no token in vault');
      }
    }

    // ── Phase 9: API Routes ── API 路由
    createAPIRoutes(this.app, this, ROOT_DIR); // 注册 API 路由（把 app、主实例、ROOT_DIR 传入）。
    console.log('  ✓ API routes registered');

    // ── Phase 10: WebSocket ──
    // 调用 setupWebSocket() 注册 WS 事件。
    this.setupWebSocket();
    console.log('  ✓ WebSocket ready');

    // ── Phase 11: Static Dashboard ──  静态仪表盘 + 兜底处理
    const dashboardPath = join(ROOT_DIR, 'dashboard', 'dist');
    // 托管静态资源。
    this.app.use(express.static(dashboardPath));
    // 对所有 GET 路由返回前端入口（SPA 兜底）。
    this.app.get('*', (_req, res) => {
      const htmlFile = join(dashboardPath, 'index.html');
      res.sendFile(htmlFile, (err) => {
        if (err) res.status(200).json({ status: 'ok', message: 'AuthorClaw running. Dashboard HTML not found.' });
      });
    });

    // JSON 404 handler — ensures unmatched API routes return JSON not HTML
    // 若路径以 /api/ 开头。
    this.app.use((req: any, res: any, next: any) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
      }
      next();
    });

    // Global JSON error handler — ensures API errors never return HTML
    this.app.use((err: any, _req: any, res: any, _next: any) => {
      console.error('Unhandled API error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: String(err?.message || err || 'Internal server error') });
      }
    });

    // Log startup to activity log
    await this.activityLog.log({
      type: 'system',
      source: 'internal',
      message: `AuthorClaw started — ${providers.length} AI provider(s), ${this.skills.getLoadedCount()} skills`,
      metadata: {
        providers: providers.map(p => p.id),
        skillCount: this.skills.getLoadedCount(),
      },
    });

    console.log('');
    console.log('  ═══════════════════════════════════');
    console.log('  ✍️  AuthorClaw is ready to write');
    console.log(`  📡 Dashboard: http://localhost:${this.config.get('server.port', 3847)}`);
    console.log('  ═══════════════════════════════════');
    console.log('');
  }
```
### getServices
返回网关的服务
```ts
  getServices() {
    return {
      config: this.config,
      memory: this.memory,
      soul: this.soul,
      heartbeat: this.heartbeat,
      costs: this.costs,
      research: this.research,
      aiRouter: this.aiRouter,
      vault: this.vault,
      permissions: this.permissions,
      audit: this.audit,
      sandbox: this.sandbox,
      skills: this.skills,
      authorOS: this.authorOS,
      tts: this.tts,
      personas: this.personas,
    };
  }
```
### setupWebSocket
```ts
  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      const origin = socket.handshake.headers.origin;
      const allowed = ['http://localhost:3847', 'http://127.0.0.1:3847'];
      if (origin && !allowed.includes(origin)) {
        this.audit.log('security', 'websocket_rejected', { origin });
        socket.disconnect();
        return;
      }

      this.audit.log('connection', 'websocket_connected', { id: socket.id });

      socket.on('message', async (data: { content: string }) => {
        try {
          await this.handleMessage(data.content, 'webchat', (response) => {
            socket.emit('response', { content: response });
          });
        } catch (error) {
          socket.emit('error', { message: 'An error occurred processing your message' });
          this.audit.log('error', 'message_processing_failed', { error: String(error) });
        }
      });

      socket.on('disconnect', () => {
        this.audit.log('connection', 'websocket_disconnected', { id: socket.id });
      });
    });
  }
```
## ConfigService

### *constructor* 构造函数

```ts
constructor(configDir: string) {
    this.configDir = configDir;// 保存配置路径
} 
```

### load

加载配置并按优先级覆盖

```ts
// 读取default.json默认配置
const defaultPath = join(this.configDir, 'default.json');
if (existsSync(defaultPath)) {
  const raw = await readFile(defaultPath, 'utf-8');
  this.config = JSON.parse(raw);
}

// Merge user overrides 读取user.json配置并合并到config中
const userPath = join(this.configDir, 'user.json');
if (existsSync(userPath)) {
  const raw = await readFile(userPath, 'utf-8');
  this.userOverrides = JSON.parse(raw);
  this.config = this.deepMerge(this.config, this.userOverrides);
}

// Environment variable overrides 环境变量覆盖
if (process.env.AUTHORCLAW_PORT) this.set('server.port', parseInt(process.env.AUTHORCLAW_PORT));
if (process.env.AUTHORCLAW_PRESET) this.set('security.permissionPreset', process.env.AUTHORCLAW_PRESET);
```

## Vault

### *constructor*构造函数

```ts
 constructor(vaultPath: string) {
    this.vaultPath = vaultPath;  // 保存路径
 }
```

### initialize

目的：保证 API key/敏感配置能“加密存储并尽量持久化”。

```ts
await mkdir(this.vaultPath, { recursive: true }); // 确保 vault 目录存在。
const filePath = join(this.vaultPath, 'vault.enc'); // 定义 vault 数据文件路径。
// 加载已有 vault 或创建新 vault
if (existsSync(filePath)) {
  const raw = await readFile(filePath, 'utf-8');
  this.data = JSON.parse(raw);
} else {
  // Create new vault
  this.data = {
    version: 1,
    salt: randomBytes(SALT_LENGTH).toString('hex'),
    entries: {},
  };
}

// Derive master key from environment variable 获取 passphrase（优先环境变量）
let passphrase = process.env.AUTHORCLAW_VAULT_KEY || '';
// 如果没设置：
// 尝试在项目 .env（通过 join(this.vaultPath, '..', '..', '.env') 推导）里自动写入一个随机 key（首次运行）。
// 写入成功：把这个 key 赋给 passphrase，并同步写回 process.env，打印成功日志。
// 写入失败：告警，后续会退化成“仅当前进程有效”的随机会话密钥。
// 若 .env 已存在但变量仍缺失：也告警，同样会退化为会话密钥。
if (!passphrase) {
  // Auto-generate a vault key and save to .env for persistence
  const envPath = join(this.vaultPath, '..', '..', '.env');
  if (!existsSync(envPath)) {
    // First run — generate and persist
    const generated = randomBytes(32).toString('hex');
    try {
      await writeFile(envPath, `# Auto-generated by AuthorClaw on first run\nAUTHORCLAW_VAULT_KEY=${generated}\n`);
      passphrase = generated;
      process.env.AUTHORCLAW_VAULT_KEY = generated;
      console.log('  🔑 Generated vault key and saved to .env — your API keys will persist across restarts.');
    } catch {
      console.warn('  ⚠️  WARNING: Could not write .env file.');
      console.warn('     Using a random session key. Vault data will NOT persist across restarts.');
      console.warn('     Set AUTHORCLAW_VAULT_KEY environment variable for production use.');
    }
  } else {
    console.warn('  ⚠️  WARNING: AUTHORCLAW_VAULT_KEY not set (check your .env file).');
    console.warn('     Using a random session key. Vault data will NOT persist across restarts.');
  }
}
// 派生主密钥并标记初始化完成
const effectivePassphrase = passphrase || randomBytes(32).toString('hex');
this.masterKey = scryptSync(
  effectivePassphrase,
  Buffer.from(this.data!.salt, 'hex'),
  KEY_LENGTH
);

this.initialized = true;
```

## PermissionManager

### *constructor*构造函数

```ts
 constructor(preset: PermissionPreset = 'standard') {
    this.preset = preset;
    this.permissions = { ...PRESETS[preset] }; // 按照传参初始化权限
  }
```

## AuditLog

### constructor构造函数

```ts
constructor(logDir: string) {
  this.logDir = logDir; // 保存日志路径
}
```

### initialize

```ts
async initialize(): Promise<void> {
  await mkdir(this.logDir, { recursive: true }); // 确保日志目录存在
}
```

## SandboxGuard

### constructor构造函数

```ts
constructor(workspaceRoot: string) {
  this.workspaceRoot = resolve(workspaceRoot); // 获取工作空间路径
}
```

## InjectionDetector

## ActivityLog

### constructor构造函数

```ts
constructor(workspaceDir: string) {
  this.logDir = join(workspaceDir, '.activity'); //保存活动日志路径
}
```

### initialize

```ts
async initialize(): Promise<void> {
  if (!existsSync(this.logDir)) {
    await mkdir(this.logDir, { recursive: true }); // 确保保存活动目录存在
  }
}
```

## SoulService

### constructor构造函数

```ts
constructor(soulDir: string) {
  this.soulDir = soulDir; // 保存soul路径
}
```

### load

从磁盘读取“人格配置”相关的 Markdown 文件，并填充到 SoulService（或类似类）的内存字段里。

```ts
async load(): Promise<void> {
  // Load personality
  const soulPath = join(this.soulDir, 'SOUL.md');
  if (existsSync(soulPath)) {
    this.personality = await readFile(soulPath, 'utf-8');
    // Extract name from first heading
    const nameMatch = this.personality.match(/^#\s+(.+)/m); // 用正则从 Markdown 里提取第一个一级标题（# xxx）作为名字。
    if (nameMatch) this.name = nameMatch[1].trim();
  }

  // Load optional personality override (e.g., snarky, formal, etc.)
  // This file is user-created and NOT shipped with AuthorClaw 
	// 聊天角色的性格设定
  const personalityPath = join(this.soulDir, 'PERSONALITY.md');
  if (existsSync(personalityPath)) {
    this.personalityOverride = await readFile(personalityPath, 'utf-8');
  }

  // Load style guide
  // 如果存在，读取到 this.styleGuide，用于写作/表达风格约束。
  const stylePath = join(this.soulDir, 'STYLE-GUIDE.md');
  if (existsSync(stylePath)) {
    this.styleGuide = await readFile(stylePath, 'utf-8');
  }

  // Load voice profile (learned from author's writing)
	// 读取到 this.voiceProfile，通常表示从作者历史文本提炼出的语气特征。
  const voicePath = join(this.soulDir, 'VOICE-PROFILE.md');
  if (existsSync(voicePath)) {
    this.voiceProfile = await readFile(voicePath, 'utf-8');
  }
}
```

## MemoryService

### constructor构造函数

```ts
constructor(memoryDir: string, config: Partial<MemoryConfig>) {
  this.memoryDir = memoryDir; // 保存记忆的路径
  this.config = {
    maxConversationHistory: config.maxConversationHistory ?? 50, //控制“会话历史”最多保留多少条
    maxMemoryEntries: config.maxMemoryEntries ?? 200, // 控制“记忆条目”最多保留多少条（默认 200）。
    autoSummarize: config.autoSummarize ?? true, // 是否自动做摘要（默认 true）。
  };
}
```

### initialize

整体上，这个方法是在做“冷启动恢复”：先保证目录结构，再从磁盘把关键状态（摘要、活动项目）读回内存。

```ts
async initialize(): Promise<void> {
  // 创建 conversations、book-bible、voice-data 三个子目录。
  await mkdir(join(this.memoryDir, 'conversations'), { recursive: true });
  await mkdir(join(this.memoryDir, 'book-bible'), { recursive: true });
  await mkdir(join(this.memoryDir, 'voice-data'), { recursive: true });

  // Load existing summaries
	// 加载摘要缓存 summaries.json
  const summaryPath = join(this.memoryDir, 'summaries.json');
  if (existsSync(summaryPath)) {
    const raw = await readFile(summaryPath, 'utf-8');
    this.conversationSummaries = JSON.parse(raw);
  }

  // Check for active project
	// 恢复当前激活项目 active-project.txt
  const activePath = join(this.memoryDir, 'active-project.txt');
  if (existsSync(activePath)) {
    this.activeProjectPath = (await readFile(activePath, 'utf-8')).trim();
  }
}
```

## CostTracker

### constructor构造函数

```ts
constructor(config: Partial<CostConfig>) {
  this.dailyLimit = config.dailyLimit ?? 5; // 每日成本上
  this.monthlyLimit = config.monthlyLimit ?? 50; // 每月成本上限
  this.alertAt = config.alertAt ?? 0.8; // 预警阈值 默认 0.8，一般表示达到上限的 80% 时触发提醒。
  this.lastResetDay = new Date().toISOString().split('T')[0]; // 最近一次按天重置
  this.lastResetMonth = new Date().toISOString().substring(0, 7); // 最近一次按月重置
}
```

## AIRouter

### constructor构造函数

```ts
constructor(config: any, vault: Vault, costs: CostTracker) {
  this.config = config;  // 保存上面初始化的AI的配置
  this.vault = vault; // 保存加密类
  this.costs = costs; // 保存预算
}
```

### initialize

根据配置和已保存的 API Key，动态注册可用的 AI 提供商到 this.providers。

```ts
// Clear any stale providers (important for reinitialize)
this.providers.clear(); //清空providers map

// ── Ollama (FREE - Local) ──
if (this.config.ollama?.enabled !== false) {
  const ollamaAvailable = await this.checkOllama(
    this.config.ollama?.endpoint || 'http://localhost:11434'
  );
  if (ollamaAvailable) {
    this.providers.set('ollama', {
      id: 'ollama',
      name: 'Ollama',
      model: this.config.ollama?.model || 'llama3.2',
      tier: 'free',
      available: true,
      endpoint: this.config.ollama?.endpoint || 'http://localhost:11434',
      maxTokens: 4096,
      costPer1kInput: 0,
      costPer1kOutput: 0,
    });
  }
}

// ── Google Gemini (FREE tier) ──
const geminiKey = await this.vault.get('gemini_api_key');
if (geminiKey) {
  this.providers.set('gemini', {
    id: 'gemini',
    name: 'Google Gemini',
    model: this.config.gemini?.model || 'gemini-2.5-flash',
    tier: 'free',
    available: true,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    maxTokens: 65536,
    costPer1kInput: 0, // Free tier
    costPer1kOutput: 0,
  });
}

// ── DeepSeek (CHEAP) ──
const deepseekKey = await this.vault.get('deepseek_api_key');
if (deepseekKey) {
  this.providers.set('deepseek', {
    id: 'deepseek',
    name: 'DeepSeek',
    model: this.config.deepseek?.model || 'deepseek-chat',
    tier: 'cheap',
    available: true,
    endpoint: 'https://api.deepseek.com/v1',
    // 限制这次模型最多可以生成多少个“输出 token”。它只限制模型“回答部分”的长度，不是输入长度。
    // max_tokens 设太小：回答容易不完整。
    // 设太大：不一定会用满，但可能增加延迟和费用。
    // 还要受模型上下文总长度限制（输入 token + 输出 token 不能超过模型上限）。
    maxTokens: 4096, 
    costPer1kInput: 0.00014,
    costPer1kOutput: 0.00028,
  });
}

// ── Anthropic Claude (PAID) ──
const claudeKey = await this.vault.get('anthropic_api_key');
if (claudeKey) {
  this.providers.set('claude', {
    id: 'claude',
    name: 'Anthropic Claude',
    model: this.config.claude?.model || 'claude-sonnet-4-5-20250929',
    tier: 'paid',
    available: true,
    endpoint: 'https://api.anthropic.com/v1',
    maxTokens: 4096,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  });
}

// ── OpenAI GPT (PAID) ──
const openaiKey = await this.vault.get('openai_api_key');
if (openaiKey) {
  this.providers.set('openai', {
    id: 'openai',
    name: 'OpenAI GPT',
    model: this.config.openai?.model || 'gpt-4o',
    tier: 'paid',
    available: true,
    endpoint: 'https://api.openai.com/v1',
    maxTokens: 4096,
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
  });
}
```

### getActiveProviders

```ts
getActiveProviders(): AIProvider[] {
  return Array.from(this.providers.values()).filter(p => p.available); // 过滤出可用的模型
}
```

## ResearchGate

### constructor构造函数

```ts
constructor(allowlistPath: string, audit: AuditLog) {
  this.allowlistPath = allowlistPath; // 保存白名单路径
  this.audit = audit; // 保存审计对象
}
```

### initialize

```ts
// 读取配置文件中白名单域名
if (existsSync(this.allowlistPath)) {
    const raw = await readFile(this.allowlistPath, 'utf-8');
    const data = JSON.parse(raw);
    // Normalize on load — same as setDomains() to prevent case/www mismatches
    this.allowedDomains = new Set(
      (data.domains || []).map((d: string) => d.trim().toLowerCase().replace(/^www\./, '')).filter(Boolean)
    );
 }
```

## SkillLoader

### constructor构造函数

```ts
constructor(skillsDir: string, permissions: PermissionManager) {
  this.skillsDir = skillsDir; // 保存 skill路径  
  this.permissions = permissions; // 保存权限对象
}
```

### loadAll

```ts
this.skills.clear(); // 清空skills map
// 按固定分类遍历：core / author / marketing / premium。
for (const category of ['core', 'author', 'marketing', 'premium'] as const) {
  const categoryDir = join(this.skillsDir, category);
  // 不存在就跳过（continue），不会报错。
  // 读取目录项，只处理“子目录”。
  // 目录名以 { 开头的会被忽略（通常用于模板/占位目录）。
  if (!existsSync(categoryDir)) continue;
  const entries = await readdir(categoryDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith('{')) continue;
			// 对每个技能目录，拼出 SKILL.md 路径：
      // 文件存在才读。
      // 读取内容后调用 parseSkill(...) 解析成 skill 对象。
      // 解析成功就 this.skills.set(skill.name, skill) 存入内存。
      // 如果是 premium 分类，会额外打印一条加载日志。
      const skillPath = join(categoryDir, entry.name, 'SKILL.md');
      if (existsSync(skillPath)) {
        try {
          const content = await readFile(skillPath, 'utf-8');
          const skill = this.parseSkill(content, entry.name, category);
          if (skill) {
            this.skills.set(skill.name, skill);
            if (category === 'premium') {
              console.log(`  ★ Premium skill loaded: ${skill.name}`);
            }
          }
        } catch (error) {
          console.error(`  ⚠ Failed to load skill: ${entry.name}`, error);
        }
      }
    }
  }
}
```
### parseSkill
这是一个“轻量 YAML 解析器”，只关心 3 个字段，不做完整 YAML 语法支持。
```ts
  private parseSkill(content: string, name: string, category: 'core' | 'author' | 'marketing' | 'premium'): Skill | null {
    // Parse YAML frontmatter
    //  用正则 ^---\n([\s\S]*?)\n--- 匹配文件开头的 YAML 区块。
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;
    // 初始化解析状态
    // triggers、permissions 用数组收集列表项。
    // description 保存描述字符串。
    // currentSection 记录“当前在解析哪个 YAML 字段”。
    const frontmatter = frontmatterMatch[1];
    const triggers: string[] = [];
    const permissions: string[] = [];
    let description = '';
    let currentSection = '';
    // 逐行扫描 frontmatter
    for (const line of frontmatter.split('\n')) {
      const trimmed = line.trim();
      // 如果行是顶级 key（line.match(/^\w/)，即首字符是字母数字下划线）：
      // description: → 提取右侧文本到 description，并标记当前 section。
      // triggers: / permissions: → 仅更新 currentSection。
      // 其他 key → currentSection = ''（忽略）。
      // Track which YAML key we're under
      if (line.match(/^\w/)) {
        if (line.startsWith('description:')) {
          description = line.replace('description:', '').trim();
          currentSection = 'description';
        } else if (line.startsWith('triggers:')) {
          currentSection = 'triggers';
        } else if (line.startsWith('permissions:')) {
          currentSection = 'permissions';
        } else {
          currentSection = '';
        }
        continue;
      }
      // 如果是列表项（trimmed.startsWith('- ')）：
      // 把 - xxx 的值清洗后放入当前 section 对应数组。
      // 在 triggers section 就 triggers.push(...)；在 permissions section 就 permissions.push(...)。
      // Parse list items under the current section
      if (trimmed.startsWith('- ')) {
        const value = trimmed.replace(/^- ["']?|["']$/g, '').trim();
        if (currentSection === 'triggers') {
          triggers.push(value);
        } else if (currentSection === 'permissions') {
          permissions.push(value);
        }
      }
    }

    return { name, description, category, triggers, permissions, content };
  }
```
### getSkillCatalog
获取所有的skill数组
```ts
  getSkillCatalog(): SkillCatalogEntry[] {
    return Array.from(this.skills.values()).map(s => ({
      name: s.name,
      description: s.description,
      category: s.category,
      triggers: s.triggers,
      premium: s.category === 'premium',
    }));
  }
```
### getSkillsByCategory
按类型给skill分组
```ts
  getSkillsByCategory(): Record<string, Array<{ name: string; description: string }>> {
    const grouped: Record<string, Array<{ name: string; description: string }>> = {};
    for (const skill of this.skills.values()) {
      if (!grouped[skill.category]) grouped[skill.category] = [];
      grouped[skill.category].push({ name: skill.name, description: skill.description });
    }
    return grouped;
  }
```
## AuthorOSService
### constructor构造函数
```ts
  constructor(basePath: string) {
    this.basePath = basePath; // 保存路径
  }
```
### initialize
在启动时扫描各类工具目录是否存在，并记录“可用性”和“实际目录名”。
```ts
const TOOL_DIRS: Record<string, string[]> = {
  'workflow-engine':     ['workflow-engine', 'Author Workflow Engine'],
  'book-bible':          ['book-bible', 'Book Bible Engine'],
  'manuscript-autopsy':  ['manuscript-autopsy', 'Manuscript Autopsy'],
  'ai-author-library':   ['ai-author-library', 'AI Author Library'],
  'format-factory':      ['format-factory', 'Format Factory Pro'],
};
```
```ts
  async initialize(): Promise<void> {
    for (const [key, dirNames] of Object.entries(TOOL_DIRS)) {
      let found = false;
      for (const dirName of dirNames) {
        const toolPath = join(this.basePath, dirName);
        if (existsSync(toolPath)) {
          this.resolvedDirs.set(key, dirName); // 记录该工具类别最终解析到哪个目录名；
          found = true;
          break;
        }
      }
      // 记录这个工具类别是否可用（是否至少找到一个目录）
      this.available.set(key, found);
    }
  }
```
### getAvailableTools
```ts
  getAvailableTools(): string[] {
    return Array.from(this.available.entries())
      .filter(([, present]) => present)
      .map(([key]) => key);
  }
```

## TTSService
### constructor 构造函数
```ts
  constructor(workspaceDir: string) {
    this.audioDir = join(workspaceDir, 'audio'); // 保存audio路径
    this.configDir = join(workspaceDir, '.config'); // 保存.config路径
  }
```
### initialize
```ts
  async initialize(): Promise<void> {
    await mkdir(this.audioDir, { recursive: true }); // 确保audio路径存在
    await mkdir(this.configDir, { recursive: true });// 确保.config路径存在
    await this.loadVoiceConfig();
  }
```
### loadVoiceConfig
读取.config/tts.json文件
```ts
  private async loadVoiceConfig(): Promise<void> {
    const configPath = join(this.configDir, 'tts.json');
    try {
      const raw = await readFile(configPath, 'utf-8');
      const config = JSON.parse(raw);
      if (config.voice && typeof config.voice === 'string') {
        this.configuredVoice = config.voice;
      }
    } catch { /* no config yet — use default */ }
  }
```
## ImageGenService
### constructor 构造函数
```ts
  constructor(workspaceDir: string, vault: Vault) {
    this.imageDir = join(workspaceDir, 'images'); // 保存图像路径
    this.vault = vault; // 保存密钥
  }
```
### initialize
```ts
  async initialize(): Promise<void> {
    await mkdir(this.imageDir, { recursive: true }); // 确保图像路径存在
  }
```
## PersonaService
### constructor 构造函数
```ts
  constructor(workspaceDir: string) {
    this.filePath = join(workspaceDir, '.config', 'personas.json'); // 保存personas.json路径
  }

```
### initialize
在启动时加载 personas 数据，并做容灾恢复。
```ts
  async initialize(): Promise<void> {
    if (existsSync(this.filePath)) {
      try {
        const raw = await readFile(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        for (const p of data.personas || []) {
          this.personas.set(p.id, p);
        }
        // Auto-backup personas on startup (safety net for updates)
        if (this.personas.size > 0) {
          const backupPath = this.filePath.replace('.json', '.backup.json');
          await writeFile(backupPath, raw, 'utf-8');
        }
      } catch (error) {
        console.error('  ⚠ Failed to load personas:', error);
        // Try to recover from backup
        const backupPath = this.filePath.replace('.json', '.backup.json');
        if (existsSync(backupPath)) {
          try {
            const backupRaw = await readFile(backupPath, 'utf-8');
            const backupData = JSON.parse(backupRaw);
            for (const p of backupData.personas || []) {
              this.personas.set(p.id, p);
            }
            console.log('  ✓ Personas recovered from backup');
            //  把恢复后的数据重新写回主文件（修复主文件损坏情况）。
            await this.persist(); // Re-save the recovered data 
          } catch {
            console.error('  ⚠ Persona backup recovery also failed');
          }
        }
      }
    }
  }
```
## ProjectEngine
### constructor 构造函数
```ts
  constructor(authorOS?: AuthorOSService, rootDir?: string) {
    this.authorOS = authorOS || null; // 保存系统路径
    this.rootDir = rootDir || process.cwd();
    // 保存项目状态配置文件路径
    this.stateFilePath = join(this.rootDir, 'workspace', '.config', 'projects-state.json');
    // 加载项目状态
    this.loadState();  // Restore projects from disk on startup
  }
```
### loadState
```ts
  private loadState(): void {
    try {
      if (!existsSync(this.stateFilePath)) return;
      const raw = readFileSync(this.stateFilePath, 'utf-8');
      const state = JSON.parse(raw);
      if (state.nextId) this.nextId = state.nextId;
      if (Array.isArray(state.projects)) {
        for (const p of state.projects) {
          this.projects.set(p.id, p);
        }
        console.log(`  ✓ Restored ${state.projects.length} projects from disk`);
      }
    } catch (err) {
      console.error('  ⚠ Failed to load project state:', err);
    }
  }
```
### setAI 
注入aiRouter回调
```ts
  setAI(complete: AICompleteFunc, selectProvider: AISelectProviderFunc): void {
    this.aiComplete = complete;
    this.aiSelectProvider = selectProvider;
  }
```
### getTemplates
写小说的步骤模版
```ts
getTemplates(): Array<{ type: ProjectType; label: string; description: string; stepCount: number; stepCountLabel?: string }> {
  return PROJECT_TEMPLATES.map(t => ({
    type: t.type, // 模板类型（ProjectType），来自 t.type，通常用于程序内部识别具体模板。
    label: t.label, // 模板显示名，来自 t.label，给前端/UI 展示给用户看的标题。
    description: t.description, // 模板描述，来自 t.description，用于说明这个模板是做什么的。
    // 步骤数量，用于显示该模板大概有多少执行步骤。
    // 普通模板：t.steps.length（真实步骤数）
    // novel-pipeline：固定写成 30（因为它是动态生成，实际不止固定数组长度）
    stepCount: t.type === 'novel-pipeline' ? 30 : t.steps.length,
    // 仅在 novel-pipeline 时提供，值为 '30+ auto-generated steps'，用于更友好地提示“30+ 且自动生成”。
    stepCountLabel: t.type === 'novel-pipeline' ? '30+ auto-generated steps' : undefined,
  }));
}
```
## HeartbeatService
### constructor 构造函数
```ts
  constructor(config: Partial<HeartbeatConfig>, memory: MemoryService) {
    this.config = {
      // 心跳检查间隔（分钟），默认 15。用于普通 heartbeat 定时逻辑（例如写作进度/提醒检查）。
      intervalMinutes: config.intervalMinutes ?? 15, 
      // 每日写作目标字数，默认 1000。用于计算进度百分比、里程碑提醒、剩余字数等。
      dailyWordGoal: config.dailyWordGoal ?? 1000,
      // 是否开启提醒，默认 true。关掉后不会发送那些激励/进度提醒。
      enableReminders: config.enableReminders ?? true,
      // 安静时段开始小时（24 小时制），默认 22（22:00）。
      quietHoursStart: config.quietHoursStart ?? 22,
      // 安静时段结束小时（24 小时制），默认 7（07:00）。
      quietHoursEnd: config.quietHoursEnd ?? 7,
      // 是否开启自治模式，默认 false。不开启就不会自动“醒来”执行项目步骤。
      autonomousEnabled: config.autonomousEnabled ?? false,
      // 自治模式唤醒间隔（分钟），默认 30。表示多久自动检查一次有没有可推进的工作。
      autonomousIntervalMinutes: config.autonomousIntervalMinutes ?? 30,
      // 每次唤醒最多执行的自治步骤数，默认 5。这是一个安全上限，防止单次运行过多。
      maxAutonomousStepsPerWake: config.maxAutonomousStepsPerWake ?? 5,
    };
    this.memory = memory;
  }
```
### setAutonomous
注入回调函数
```ts
  setAutonomous(
    runStep: AutonomousRunFunc,
    listProjects: AutonomousProjectListFunc,
    broadcast: StatusBroadcastFunc,
    analyzeProject?: AnalyzeProjectFunc,
    createFollowUp?: CreateFollowUpProjectFunc,
    idleTask?: IdleTaskFunc
  ): void {
    this.autonomousRunStep = runStep;
    this.autonomousListProjects = listProjects;
    this.statusBroadcast = broadcast;
    this.analyzeProject = analyzeProject || null;
    this.createFollowUpProject = createFollowUp || null;
    this.idleTask = idleTask || null;
  }
```
### start
```ts
  start(): void {
    // Standard heartbeat timer (session tracking, streaks)
    this.timer = setInterval(
      () => this.tick(),
      this.config.intervalMinutes * 60 * 1000
    );

    // Autonomous timer (goal execution) — separate interval
    if (this.config.autonomousEnabled && this.autonomousRunStep) {
      this.startAutonomous();
    }
  }
```
### tick
做写作的统计
```ts
  private async tick(): Promise<void> {
    // 先拿当前时间：now 和 hour。
    const now = new Date();
    const hour = now.getHours();

    // Respect quiet hours
    // 静默时段直接退出：如果 isQuietHours(hour) 为真，就 return，后续逻辑都不执行。
    if (this.isQuietHours(hour)) {
      return;
    }

    // Check for day rollover
    // 处理“跨天”状态：
    const today = now.toISOString().split('T')[0];
    if (this.lastWritingDate && this.lastWritingDate !== today) {
      // Check if yesterday had words (streak tracking)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (this.lastWritingDate === yesterdayStr && this.todayWords > 0) {
        this.streak++;
      } else if (this.lastWritingDate !== yesterdayStr) {
        this.streak = 0;
      }

      this.todayWords = 0;
    }

    // Check reminders (if enabled)
    if (this.config.enableReminders) {
      this.checkReminders(now, today);
    }
  }
```

## createAPIRoutes 
接口层
```ts
export function createAPIRoutes(app: Application, gateway: any, rootDir?: string): void {
  const services = gateway.getServices();
  const baseDir = rootDir || process.cwd();

  // ── Health Check ── 健康检测，判断服务有没有挂
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: '4.0.0',
      name: 'AuthorClaw',
      brand: 'Writing Secrets',
      uptime: process.uptime(),
      links: {
        website: 'https://www.getwritingsecrets.com',
        kofi: 'https://ko-fi.com/s/4e24f1dfa5',
        youtube: 'https://www.youtube.com/@WritingSecrets',
      },
    });
  });

  // ── Status Dashboard ──
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({
      soul: services.soul.getName(),
      providers: services.aiRouter.getActiveProviders().map((p: any) => ({
        id: p.id, name: p.name, model: p.model, tier: p.tier,
      })),
      costs: services.costs.getStatus(),
      skills: {
        total: services.skills.getLoadedCount(),
        author: services.skills.getAuthorSkillCount(),
        premium: services.skills.getPremiumSkillCount(),
        premiumInstalled: services.skills.getPremiumSkills(),
        catalog: services.skills.getSkillCatalog(),
        byCategory: services.skills.getSkillsByCategory(),
      },
      heartbeat: services.heartbeat.getStats(),
      autonomous: services.heartbeat.getAutonomousStatus(),
      permissions: services.permissions.preset,
      cache: services.aiRouter.getCacheStats(),
      personas: services.personas ? {
        count: services.personas.getCount(),
        list: services.personas.list().map((p: any) => ({ id: p.id, penName: p.penName, genre: p.genre })),
      } : { count: 0, list: [] },
    });
  });

  // ── Chat API (for integrations) ──
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message, skipHistory } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message required' });
    }
    if (message.length > 10000) {
      return res.status(400).json({ error: 'Message too long (max 10,000 chars)' });
    }

    // Slash commands + natural language commands: route to dedicated handler
    const lower = message.toLowerCase().trim();
    const isCommand = message.startsWith('/') ||
      ['continue', 'next', 'go', 'resume'].includes(lower);
    if (isCommand) {
      try {
        const result = await gateway.handleDashboardCommand(message);
        return res.json({ response: result });
      } catch (err: any) {
        return res.json({ response: 'Command error: ' + String(err?.message || err) });
      }
    }

    // Regular chat: use AI
    const channel = skipHistory ? 'conductor' : 'api';
    let response = '';
    try {
      await gateway.handleMessage(message, channel, (text: string) => {
        response = text;
      });
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('No AI providers')) {
        return res.status(503).json({ error: 'No AI providers configured. Add an API key in Settings → API Keys.' });
      }
      return res.status(500).json({ error: 'AI error: ' + msg });
    }

    res.json({ response });
  });

  // ── Project Management ──
  app.get('/api/projects', async (_req: Request, res: Response) => {
    const { readdir } = await import('fs/promises');
    const { existsSync } = await import('fs');
    const { join } = await import('path');

    const projectsDir = join(baseDir, 'workspace', 'projects');
    if (!existsSync(projectsDir)) {
      return res.json({ projects: [] });
    }

    const entries = await readdir(projectsDir, { withFileTypes: true });
    const projects = entries.filter(e => e.isDirectory() && e.name !== '.template').map(e => e.name);
    res.json({ projects });
  });

  // ── Cost Report ──
  app.get('/api/costs', (_req: Request, res: Response) => {
    res.json(services.costs.getStatus());
  });

  // ── Audit Log (last 50 entries) ──
  app.get('/api/audit', async (_req: Request, res: Response) => {
    const { readFile } = await import('fs/promises');
    const { existsSync } = await import('fs');
    const { join } = await import('path');

    const today = new Date().toISOString().split('T')[0];
    const logFile = join(baseDir, 'workspace', '.audit', `${today}.jsonl`);

    if (!existsSync(logFile)) {
      return res.json({ entries: [] });
    }

    const raw = await readFile(logFile, 'utf-8');
    const entries = raw.trim().split('\n').map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean).slice(-50);

    res.json({ entries });
  });

  // ═══════════════════════════════════════════════════════════
  // Activity Log (universal agent action feed)
  // ═══════════════════════════════════════════════════════════

  // Get recent activity entries
  app.get('/api/activity', async (req: Request, res: Response) => {
    const activityLog = gateway.getActivityLog?.();
    if (!activityLog) {
      return res.json({ entries: [] });
    }
    const count = Number(req.query.count) || 50;
    const goalId = req.query.goalId as string | undefined;
    const entries = await activityLog.getRecent(count, goalId);
    res.json({ entries });
  });

  // SSE stream for real-time activity updates
  app.get('/api/activity/stream', (req: Request, res: Response) => {
    const activityLog = gateway.getActivityLog?.();
    if (!activityLog) {
      return res.status(503).json({ error: 'Activity log not initialized' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send initial heartbeat
    res.write('data: {"type":"connected"}\n\n');

    // Register this client for live updates
    const cleanup = activityLog.addSSEClient(res);

    // Clean up on disconnect
    req.on('close', cleanup);
  });

  // ═══════════════════════════════════════════════════════════
  // Memory Management
  // ═══════════════════════════════════════════════════════════

  app.post('/api/memory/reset', async (req: Request, res: Response) => {
    const fullReset = req.query.full === 'true' || req.body?.full === true;
    try {
      const result = await services.memory.reset(fullReset);
      await services.audit.log('memory', 'reset', { fullReset, cleared: result.cleared });
      res.json({ success: true, ...result, fullReset });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset memory: ' + String(error) });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // Vault Management (for dashboard API key configuration)
  // ═══════════════════════════════════════════════════════════

  // Store a key in the encrypted vault
  app.post('/api/vault', async (req: Request, res: Response) => {
    const { key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ error: 'key and value required' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      return res.status(400).json({ error: 'Invalid key name. Use only letters, numbers, underscores, and hyphens.' });
    }
    try {
      await services.vault.set(key, value);
      await services.audit.log('vault', 'key_stored', { key });

      // Auto-refresh AI providers when an API key is stored
      const apiKeyNames = ['gemini_api_key', 'deepseek_api_key', 'anthropic_api_key', 'openai_api_key'];
      let refreshedProviders: string[] | undefined;
      if (apiKeyNames.includes(key)) {
        refreshedProviders = await services.aiRouter.reinitialize();
      }

      res.json({ success: true, key, refreshedProviders });
    } catch (error) {
      res.status(500).json({ error: 'Failed to store key' });
    }
  });

  // Manually refresh AI provider detection
  app.post('/api/providers/refresh', async (_req: Request, res: Response) => {
    try {
      const providers = await services.aiRouter.reinitialize();
      res.json({
        success: true,
        providers: services.aiRouter.getActiveProviders().map((p: any) => ({
          id: p.id, name: p.name, model: p.model, tier: p.tier,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to refresh providers: ' + String(error) });
    }
  });

  // Load API keys from text files in the VM shared folder
  app.post('/api/vault/load-from-files', async (req: Request, res: Response) => {
    const { readFile: rf } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');
    const { join: j } = await import('path');

    // Check common shared folder locations (VM, Docker, or user-set env var)
    const candidates = [
      process.env.AUTHORCLAW_KEYS_DIR,
      '/media/sf_authorclaw-transfer',
      '/media/sf_vm-transfer',
      j(baseDir, '..', 'vm-transfer'),
    ].filter(Boolean) as string[];
    const sharedFolder = candidates.find(p => ex(p));
    if (!sharedFolder) {
      return res.status(404).json({ error: 'No key folder found. Add API keys manually in Settings above.' });
    }

    const keyFiles: Record<string, string> = {
      'gemini_api_key': 'gemini_api_key.txt',
      'deepseek_api_key': 'deepseek_api_key.txt',
      'anthropic_api_key': 'anthropic_api_key.txt',
      'openai_api_key': 'openai_api_key.txt',
      'telegram_bot_token': 'telegram_bot_token.txt',
    };

    const loaded: string[] = [];
    const errors: string[] = [];

    for (const [vaultKey, filename] of Object.entries(keyFiles)) {
      const filePath = j(sharedFolder, filename);
      if (ex(filePath)) {
        try {
          const value = (await rf(filePath, 'utf-8')).trim();
          if (value && value.length > 5) {
            await services.vault.set(vaultKey, value);
            await services.audit.log('vault', 'key_loaded_from_file', { key: vaultKey, file: filename });
            loaded.push(vaultKey);
          }
        } catch (e) {
          errors.push(`${filename}: ${String(e)}`);
        }
      }
    }

    // Generic key.txt fallback
    const fallbackKey = req.body?.fallbackKeyName || 'gemini_api_key';
    const genericPath = j(sharedFolder, 'key.txt');
    if (ex(genericPath) && !loaded.includes(fallbackKey)) {
      try {
        const value = (await rf(genericPath, 'utf-8')).trim();
        if (value && value.length > 5) {
          await services.vault.set(fallbackKey, value);
          await services.audit.log('vault', 'key_loaded_from_file', { key: fallbackKey, file: 'key.txt' });
          loaded.push(fallbackKey + ' (from key.txt)');
        }
      } catch (e) {
        errors.push(`key.txt: ${String(e)}`);
      }
    }

    // Re-initialize AI providers if any API keys were loaded
    const apiKeyNames = ['gemini_api_key', 'deepseek_api_key', 'anthropic_api_key', 'openai_api_key'];
    if (loaded.some(k => apiKeyNames.some(ak => k.startsWith(ak)))) {
      await services.aiRouter.reinitialize();
    }

    res.json({ loaded, errors, message: loaded.length > 0 ? `Loaded ${loaded.length} key(s)` : 'No key files found in shared folder' });
  });

  // List stored key names (never values)
  app.get('/api/vault/keys', async (_req: Request, res: Response) => {
    const keys = await services.vault.list();
    res.json({ keys });
  });

  // Delete a key from the vault
  app.delete('/api/vault/:key', async (req: Request, res: Response) => {
    const deleted = await services.vault.delete(req.params.key);
    if (deleted) {
      await services.audit.log('vault', 'key_deleted', { key: req.params.key });
    }
    res.json({ success: deleted });
  });

  // ═══════════════════════════════════════════════════════════
  // Config (sanitized, read-only for dashboard)
  // ═══════════════════════════════════════════════════════════

  app.get('/api/config', (_req: Request, res: Response) => {
    res.json({
      ai: services.config.get('ai'),
      heartbeat: services.config.get('heartbeat'),
      costs: services.config.get('costs'),
      security: { permissionPreset: services.config.get('security.permissionPreset') },
    });
  });

  // Update a single config value (for dashboard settings)
  app.post('/api/config/update', (req: Request, res: Response) => {
    const { path, value } = req.body;
    if (!path) return res.status(400).json({ error: 'path required' });
    const safePaths = [
      'costs.dailyLimit', 'costs.monthlyLimit',
      'heartbeat.intervalMinutes', 'heartbeat.dailyWordGoal',
      'heartbeat.enableReminders', 'heartbeat.quietHoursStart',
      'heartbeat.quietHoursEnd', 'heartbeat.autonomousEnabled',
      'heartbeat.autonomousIntervalMinutes', 'heartbeat.maxAutonomousStepsPerWake',
      'ai.defaultTemperature',
      'ai.ollama.enabled', 'ai.ollama.endpoint', 'ai.ollama.model',
      'bridges.telegram.enabled', 'bridges.telegram.pairingEnabled',
    ];
    if (!safePaths.includes(path)) {
      return res.status(403).json({ error: 'Config path not allowed' });
    }
    services.config.set(path, value);
    res.json({ success: true, path, value });
  });

  // ═══════════════════════════════════════════════════════════
  // Telegram Bridge Management (dashboard integration)
  // ═══════════════════════════════════════════════════════════

  app.get('/api/telegram/status', async (_req: Request, res: Response) => {
    const enabled = services.config.get('bridges.telegram.enabled', false);
    const hasToken = (await services.vault.list()).includes('telegram_bot_token');
    const allowedUsers: string[] = services.config.get('bridges.telegram.allowedUsers', []);
    const connected = gateway.isTelegramConnected?.() || false;

    res.json({
      enabled,
      hasToken,
      connected,
      allowedUsers,
      pairingEnabled: services.config.get('bridges.telegram.pairingEnabled', true),
    });
  });

  app.post('/api/telegram/users', async (req: Request, res: Response) => {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'users must be an array of user ID strings' });
    }
    const valid = users.every((u: any) => typeof u === 'string' && /^\d+$/.test(u));
    if (!valid) {
      return res.status(400).json({ error: 'Each user ID must be a numeric string' });
    }
    await services.config.setAndPersist('bridges.telegram.allowedUsers', users);
    gateway.updateTelegramUsers?.(users);
    res.json({ success: true, users });
  });

  app.post('/api/telegram/connect', async (_req: Request, res: Response) => {
    try {
      const result = await gateway.connectTelegram?.();
      if (result?.error) {
        return res.status(400).json({ error: result.error });
      }
      await services.config.setAndPersist('bridges.telegram.enabled', true);
      res.json({ success: true, message: 'Telegram bridge connected' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to connect Telegram: ' + String(error) });
    }
  });

  app.post('/api/telegram/disconnect', async (_req: Request, res: Response) => {
    gateway.disconnectTelegram?.();
    await services.config.setAndPersist('bridges.telegram.enabled', false);
    res.json({ success: true, message: 'Telegram bridge disconnected' });
  });

  app.post('/api/telegram/test', async (req: Request, res: Response) => {
    const token = req.body.token || await services.vault.get('telegram_bot_token');
    if (!token) {
      return res.status(400).json({ error: 'No token provided or stored' });
    }
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json() as any;
      if (data.ok) {
        res.json({ success: true, bot: { username: data.result.username, name: data.result.first_name } });
      } else {
        res.status(400).json({ error: data.description || 'Invalid token' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to test token: ' + String(error) });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // Project Engine (autonomous project-based task planning)
  // ═══════════════════════════════════════════════════════════

  app.get('/api/projects/templates', async (_req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    // Merge built-in templates with custom templates
    const builtIn = engine.getTemplates();
    const { join: j } = await import('path');
    const { readFile: rf } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');
    const customPath = j(baseDir, 'workspace', '.config', 'custom-project-templates.json');
    let custom: any[] = [];
    if (ex(customPath)) {
      try { custom = JSON.parse(await rf(customPath, 'utf-8')); } catch { /* ok */ }
    }
    const customMapped = custom.map((t: any) => ({
      ...t, label: t.title, stepCount: 0, custom: true,
    }));
    res.json({ templates: [...builtIn, ...customMapped] });
  });

  // Save a custom project template
  app.post('/api/projects/templates', async (req: Request, res: Response) => {
    const { title, description, type } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description required' });
    }
    const { join: j } = await import('path');
    const { readFile: rf, writeFile: wf, mkdir: mkd } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');
    const { randomBytes } = await import('crypto');
    const configDir = j(baseDir, 'workspace', '.config');
    await mkd(configDir, { recursive: true });
    const customPath = j(configDir, 'custom-project-templates.json');
    let custom: any[] = [];
    if (ex(customPath)) {
      try { custom = JSON.parse(await rf(customPath, 'utf-8')); } catch { /* ok */ }
    }
    custom.push({ id: randomBytes(6).toString('hex'), title, description, type: type || 'general', createdAt: new Date().toISOString() });
    await wf(customPath, JSON.stringify(custom, null, 2));
    res.json({ success: true });
  });

  // Delete a custom project template
  app.delete('/api/projects/templates/:id', async (req: Request, res: Response) => {
    const { join: j } = await import('path');
    const { readFile: rf, writeFile: wf } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');
    const customPath = j(baseDir, 'workspace', '.config', 'custom-project-templates.json');
    if (!ex(customPath)) {
      return res.json({ success: false, error: 'No custom templates' });
    }
    let custom: any[] = [];
    try { custom = JSON.parse(await rf(customPath, 'utf-8')); } catch { /* ok */ }
    custom = custom.filter((t: any) => t.id !== req.params.id);
    await wf(customPath, JSON.stringify(custom, null, 2));
    res.json({ success: true });
  });

  // Create a new project — supports dynamic AI planning
  app.post('/api/projects/create', async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const { type, title, description, context, planning, config, personaId, preferredProvider } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description required' });
    }

    // Helper to set optional fields on newly created projects
    const applyProjectOptions = (project: any) => {
      if (personaId) project.personaId = personaId;
      if (preferredProvider) project.preferredProvider = preferredProvider;
    };

    // Novel pipeline: use dedicated pipeline builder
    // Trust the explicitly-sent type; only infer from description if no type provided
    const inferredType = type || engine.inferProjectType(description);
    if (inferredType === 'novel-pipeline') {
      const project = engine.createNovelPipeline(title, description, config || context);
      applyProjectOptions(project);
      return res.json({ project, planning: 'novel-pipeline' });
    }

    // Book Production: uses dynamic chapter generation
    if (inferredType === 'book-production') {
      const project = engine.createBookProduction(title, description, config || context || {});
      applyProjectOptions(project);
      return res.json({ project, planning: 'book-production' });
    }

    // Dynamic planning: ask the AI to figure out the steps
    if (planning === 'dynamic') {
      const skillCatalog = services.skills.getSkillCatalog();
      const authorOSTools = services.authorOS?.getAvailableTools() || [];
      const project = await engine.planProject(title, description, skillCatalog, authorOSTools, context);
      applyProjectOptions(project);
      return res.json({ project, planning: 'dynamic' });
    }

    // Template-based fallback
    const projectType = inferredType;
    const project = engine.createProject(projectType, title, description, context);
    applyProjectOptions(project);
    res.json({ project, planning: 'template' });
  });

  // ── Pipeline Creation (chains all 6 phases) ──
  app.post('/api/pipeline/create', async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const { title, description, personaId, config } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description required' });
    }
    try {
      const result = engine.createPipeline(title, description, personaId, config);
      res.json({
        pipelineId: result.pipelineId,
        phases: result.projects.map((p: any) => ({
          id: p.id,
          type: p.type,
          title: p.title,
          phase: p.pipelinePhase,
          steps: p.steps.length,
          status: p.status,
        })),
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create pipeline: ' + String(err) });
    }
  });

  // ── Pipeline Status ──
  app.get('/api/pipeline/:pipelineId', (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const projects = engine.getPipelineProjects(req.params.pipelineId);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    res.json({
      pipelineId: req.params.pipelineId,
      phases: projects.map((p: any) => ({
        id: p.id,
        type: p.type,
        title: p.title,
        phase: p.pipelinePhase,
        steps: p.steps.length,
        completedSteps: p.steps.filter((s: any) => s.status === 'completed' || s.status === 'skipped').length,
        status: p.status,
        progress: p.progress,
      })),
    });
  });

  app.get('/api/projects/list', (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const status = (req.query as any).status;
    res.json({ projects: engine.listProjects(status) });
  });

  app.get('/api/projects/:id', (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const project = engine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project });
  });

  app.post('/api/projects/:id/start', (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const step = engine.startProject(req.params.id);
    if (!step) {
      return res.status(404).json({ error: 'Project not found or no pending steps' });
    }
    res.json({ step, project: engine.getProject(req.params.id) });
  });

  /**
   * Smart excerpt builder for large manuscripts.
   * Reads the full document from disk and extracts a relevant excerpt
   * that fits within AI context limits while preserving the most useful content.
   *
   * Strategy: first 20K chars + last 5K chars (with truncation marker)
   * This gives the AI the beginning (setup, style, voice) and ending (current state)
   * which is ideal for revision, editing, and analysis tasks.
   */
  async function getSmartExcerpt(filePath: string, wordCount: number): Promise<string> {
    const { readFile: rf } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');

    if (!ex(filePath)) {
      return `[Document not found at ${filePath} — it may have been moved or deleted]`;
    }

    const fullText = await rf(filePath, 'utf-8');
    const MAX_CHARS = 25000; // ~6K words — fits comfortably in AI context

    if (fullText.length <= MAX_CHARS) {
      return fullText; // Small enough to include everything
    }

    // Smart split: first 20K + last 5K
    const headSize = 20000;
    const tailSize = 5000;
    const head = fullText.substring(0, headSize);
    const tail = fullText.substring(fullText.length - tailSize);

    const omittedChars = fullText.length - headSize - tailSize;
    const omittedWords = Math.round(omittedChars / 5); // rough estimate

    return `${head}\n\n` +
      `[... ⚠️ MIDDLE SECTION OMITTED: ~${omittedWords.toLocaleString()} words skipped to fit context. ` +
      `Full document (${wordCount.toLocaleString()} words) is saved in workspace/documents/. ...]\n\n` +
      `${tail}`;
  }

  // Helper: build user message for project step execution
  // Injects uploaded manuscript DIRECTLY into the user message so the AI can't miss it
  // For large documents (15K+ words): reads from disk and applies smart truncation
  async function buildStepUserMessage(project: any, step: any): Promise<string> {
    let message = step.prompt;
    const uploads = project.context?.uploads || [];
    const fileList = uploads.map((u: any) => `${u.filename} (${u.wordCount?.toLocaleString() || '?'} words)`).join(', ');

    // Large document path: read from disk with smart truncation
    if (project.context?.documentLibraryFile) {
      const excerpt = await getSmartExcerpt(
        project.context.documentLibraryFile,
        project.context.documentWordCount || 0
      );
      message = `## Manuscript to Work With\n\nUploaded files: ${fileList}\n\n${excerpt}\n\n---\n\n## Your Task\n\n${message}`;
      return message;
    }

    // Small document path: use inline uploaded content (same as before)
    if (project.context?.uploadedContent) {
      const uploaded = String(project.context.uploadedContent).substring(0, 30000);
      message = `## Manuscript to Work With\n\nUploaded files: ${fileList}\n\n${uploaded}\n\n---\n\n## Your Task\n\n${message}`;
    }

    return message;
  }

  app.post('/api/projects/:id/execute', async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const project = engine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const activeStep = project.steps.find((s: any) => s.status === 'active');
    if (!activeStep) {
      return res.status(400).json({ error: 'No active step. Start the project first.' });
    }

    try {
      const projectContext = await engine.buildProjectContext(project, activeStep);
      const userMessage = await buildStepUserMessage(project, activeStep);
      let response = '';

      await gateway.handleMessage(
        userMessage,
        'projects',
        (text: string) => { response = text; },
        projectContext,
        activeStep.taskType || undefined  // Use step's own taskType for routing
      );

      // Retry once with 'general' routing if the response is too short
      if (!response || response.length < 50) {
        console.log(`  ↻ Step "${activeStep.label}" got short response — retrying with general routing...`);
        response = '';
        await gateway.handleMessage(
          userMessage,
          'projects',
          (text: string) => { response = text; },
          projectContext,
          'general'
        );
      }

      if (!response || response.length < 50) {
        engine.failStep(project.id, activeStep.id, 'Empty or too-short response from AI');
        return res.json({
          success: false,
          error: 'AI returned an insufficient response',
          project: engine.getProject(project.id),
        });
      }

      const nextStep = engine.completeStep(project.id, activeStep.id, response);

      res.json({
        success: true,
        completedStep: activeStep.id,
        response,
        nextStep,
        project: engine.getProject(project.id),
      });
    } catch (error) {
      engine.failStep(project.id, activeStep.id, String(error));
      res.status(500).json({
        error: 'Step execution failed: ' + String(error),
        project: engine.getProject(project.id),
      });
    }
  });

  // Auto-execute ALL steps of a project (fully autonomous mode)
  app.post('/api/projects/:id/auto-execute', async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const project = engine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status === 'pending') {
      engine.startProject(req.params.id);
    } else if (project.status === 'paused') {
      project.status = 'active';
      const firstPending = project.steps.find((s: any) => s.status === 'pending');
      if (firstPending) firstPending.status = 'active';
    }

    const results: Array<{ step: string; success: boolean; wordCount?: number; error?: string }> = [];
    const { join } = await import('path');
    const { mkdir, writeFile } = await import('fs/promises');
    const workspaceDir = join(baseDir, 'workspace');

    while (true) {
      const currentProject = engine.getProject(req.params.id);
      if (!currentProject) break;

      // Check if project was paused externally (via /stop or dashboard)
      if (currentProject.status === 'paused' || currentProject.status === 'completed') break;

      const activeStep = currentProject.steps.find((s: any) => s.status === 'active');
      if (!activeStep) break;

      try {
        const projectContext = await engine.buildProjectContext(currentProject, activeStep);
        const userMessage = await buildStepUserMessage(currentProject, activeStep);
        let response = '';

        await gateway.handleMessage(
          userMessage,
          'project-engine',
          (text: string) => { response = text; },
          projectContext,
          activeStep.taskType || undefined  // Use step's own taskType for routing
        );

        // Retry once with 'general' routing if the response is too short
        // This catches cases where a premium/mid provider fails but free providers work fine
        if (!response || response.length < 50) {
          console.log(`  ↻ Step "${activeStep.label}" got short response — retrying with general routing...`);
          response = '';
          await gateway.handleMessage(
            userMessage,
            'project-engine',
            (text: string) => { response = text; },
            projectContext,
            'general'  // Force free-tier routing (Gemini first)
          );
        }

        if (!response || response.length < 50) {
          engine.failStep(currentProject.id, activeStep.id, 'Empty or too-short response from AI');
          results.push({ step: activeStep.label, success: false, error: 'Insufficient AI response' });
          break;
        }

        const wordCount = response.split(/\s+/).length;

        // Save to file
        try {
          const projectDir = join(workspaceDir, 'projects', currentProject.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
          await mkdir(projectDir, { recursive: true });
          const stepFileName = `${activeStep.id}-${activeStep.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
          await writeFile(join(projectDir, stepFileName), `# ${activeStep.label}\n\n${response}`, 'utf-8');
        } catch { /* non-fatal */ }

        engine.completeStep(currentProject.id, activeStep.id, response);
        // Track words for Morning Briefing
        services.heartbeat.addWords(wordCount);
        results.push({ step: activeStep.label, success: true, wordCount });

        // ── Manuscript Assembly: combine chapter files after assembly step ──
        if ((activeStep as any).phase === 'assembly' && currentProject.type === 'novel-pipeline') {
          try {
            const { existsSync: exLocal } = await import('fs');
            const { readFile: readF } = await import('fs/promises');
            const projectSlug = currentProject.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const projectDir = join(workspaceDir, 'projects', projectSlug);

            const writingSteps = currentProject.steps
              .filter((s: any) => s.phase === 'writing' && s.status === 'completed')
              .sort((a: any, b: any) => (a.chapterNumber || 0) - (b.chapterNumber || 0));

            const chapterContents: string[] = [];
            for (const ws of writingSteps) {
              const expectedFile = `${(ws as any).id}-${(ws as any).label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
              const fullPath = join(projectDir, expectedFile);
              if (exLocal(fullPath)) {
                const raw = await readF(fullPath, 'utf-8');
                const content = raw.replace(/^# .+\n\n/, '');
                chapterContents.push(`## Chapter ${(ws as any).chapterNumber || chapterContents.length + 1}\n\n${content}`);
              }
            }

            if (chapterContents.length > 0) {
              const manuscriptMd = `# ${currentProject.title}\n\n` + chapterContents.join('\n\n---\n\n');
              await writeFile(join(projectDir, 'manuscript.md'), manuscriptMd, 'utf-8');

              const docxBuffer = await generateDocxBuffer({
                title: currentProject.title,
                author: 'AuthorClaw',
                content: manuscriptMd,
              });
              await writeFile(join(projectDir, 'manuscript.docx'), docxBuffer);
              console.log(`  [assembly] Manuscript assembled: ${chapterContents.length} chapters`);
            }
          } catch { /* non-fatal */ }
        }

        // Re-check pause AFTER step completes (catches /stop sent during long AI call)
        const freshProject = engine.getProject(req.params.id);
        if (freshProject?.status === 'paused' || freshProject?.status === 'completed') break;
      } catch (error) {
        engine.failStep(currentProject.id, activeStep.id, String(error));
        results.push({ step: activeStep.label, success: false, error: String(error) });
        break;
      }
    }

    res.json({
      success: true,
      results,
      project: engine.getProject(req.params.id),
    });
  });

  app.post('/api/projects/:id/skip/:stepId', (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const nextStep = engine.skipStep(req.params.id, req.params.stepId);
    res.json({ nextStep, project: engine.getProject(req.params.id) });
  });

  app.post('/api/projects/:id/pause', (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    engine.pauseProject(req.params.id);
    res.json({ project: engine.getProject(req.params.id) });
  });

  // ── Resume a stuck/completed project that still has pending or active steps ──
  app.post('/api/projects/:id/resume', (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const project = engine.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Fix orphaned active steps — reset all but the first to pending
    const activeSteps = project.steps.filter((s: any) => s.status === 'active');
    if (activeSteps.length > 1) {
      // Keep only the first active step, reset the rest to pending
      for (let i = 1; i < activeSteps.length; i++) {
        activeSteps[i].status = 'pending';
      }
    }

    // If all remaining steps are 'pending' but none are 'active', activate the first one
    const hasActive = project.steps.some((s: any) => s.status === 'active');
    if (!hasActive) {
      const nextPending = project.steps.find((s: any) => s.status === 'pending');
      if (nextPending) nextPending.status = 'active';
    }

    // Set project status back to active
    const remaining = project.steps.filter((s: any) => s.status === 'pending' || s.status === 'active');
    if (remaining.length > 0) {
      project.status = 'active';
      delete (project as any).completedAt;
      project.updatedAt = new Date().toISOString();
    }

    // Recalculate progress
    const done = project.steps.filter((s: any) => s.status === 'completed' || s.status === 'skipped').length;
    project.progress = Math.round((done / project.steps.length) * 100);

    res.json({
      resumed: true,
      status: project.status,
      progress: project.progress,
      activeStep: project.steps.find((s: any) => s.status === 'active')?.label || null,
      remainingSteps: remaining.length,
    });
  });

  app.delete('/api/projects/:id', async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }

    // Get project info before deleting (to find files on disk)
    const project = engine.getProject(req.params.id);
    const deleteFiles = req.query.files === 'true';

    const deleted = engine.deleteProject(req.params.id);

    // Optionally delete workspace files too
    let filesDeleted = 0;
    if (deleted && deleteFiles && project) {
      try {
        const { join: j } = await import('path');
        const { rm } = await import('fs/promises');
        const { existsSync: ex } = await import('fs');
        const projectSlug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const projectDir = j(baseDir, 'workspace', 'projects', projectSlug);
        if (ex(projectDir)) {
          const { readdir } = await import('fs/promises');
          const entries = await readdir(projectDir);
          filesDeleted = entries.length;
          await rm(projectDir, { recursive: true });
        }
      } catch { /* non-fatal */ }
    }

    res.json({ success: deleted, filesDeleted });
  });

  // ═══════════════════════════════════════════════════════════
  // Document Library (centralized document storage for large manuscripts)
  // ═══════════════════════════════════════════════════════════

  // List all documents in the library
  app.get('/api/documents', async (_req: Request, res: Response) => {
    const { join: j } = await import('path');
    const { readdir: rd, stat: st, readFile: rf } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');

    const docsDir = j(baseDir, 'workspace', 'documents');
    if (!ex(docsDir)) {
      return res.json({ documents: [] });
    }

    try {
      const entries = await rd(docsDir);
      const docs: Array<{ filename: string; size: number; wordCount?: number; uploadedAt?: string }> = [];

      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'metadata.json') continue;
        const fullPath = j(docsDir, entry);
        const info = await st(fullPath);
        if (!info.isFile()) continue;

        let wordCount: number | undefined;
        const ext = entry.split('.').pop()?.toLowerCase();
        if (ext === 'txt' || ext === 'md') {
          try {
            const text = await rf(fullPath, 'utf-8');
            wordCount = text.split(/\s+/).filter(Boolean).length;
          } catch { /* skip */ }
        }

        docs.push({
          filename: entry,
          size: info.size,
          wordCount,
          uploadedAt: info.mtime.toISOString(),
        });
      }

      // Load metadata for word counts of docx files
      const metaPath = j(docsDir, 'metadata.json');
      let metadata: Record<string, any> = {};
      if (ex(metaPath)) {
        try { metadata = JSON.parse(await rf(metaPath, 'utf-8')); } catch { /* ok */ }
      }
      for (const doc of docs) {
        if (!doc.wordCount && metadata[doc.filename]?.wordCount) {
          doc.wordCount = metadata[doc.filename].wordCount;
        }
      }

      res.json({ documents: docs });
    } catch {
      res.json({ documents: [] });
    }
  });

  // Upload a document directly to the library (not tied to a project)
  app.post('/api/documents/upload', multer({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for library
    fileFilter: (_req, file, cb) => {
      const allowed = ['.txt', '.md', '.docx'];
      const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`File type "${ext}" not supported. Use .txt, .md, or .docx`));
      }
    },
    storage: multer.memoryStorage(),
  }).single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { join: j } = await import('path');
    const { mkdir: mkd, writeFile: wf, readFile: rf } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');

    const docsDir = j(baseDir, 'workspace', 'documents');
    await mkd(docsDir, { recursive: true });

    const filename = req.file.originalname;
    const ext = filename.split('.').pop()?.toLowerCase();

    // Save the raw file
    await wf(j(docsDir, filename), req.file.buffer);

    // Extract text and word count
    let textContent = '';
    if (ext === 'txt' || ext === 'md') {
      textContent = req.file.buffer.toString('utf-8');
    } else if (ext === 'docx') {
      try {
        const AdmZip = (await import('adm-zip')).default;
        const zip = new AdmZip(req.file.buffer);
        const docEntry = zip.getEntry('word/document.xml');
        if (docEntry) {
          const xml = docEntry.getData().toString('utf-8');
          const paragraphs: string[] = [];
          const paraMatches = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
          for (const para of paraMatches) {
            const textParts = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
            if (textParts) {
              const line = textParts.map(t => t.replace(/<[^>]+>/g, '')).join('');
              if (line.trim()) paragraphs.push(line);
            }
          }
          textContent = paragraphs.join('\n\n');
        }
      } catch { /* ok */ }

      // Save extracted text alongside for fast access
      if (textContent) {
        const textFilename = filename.replace(/\.docx$/i, '.extracted.txt');
        await wf(j(docsDir, textFilename), textContent);
      }
    }

    const wordCount = textContent.split(/\s+/).filter(Boolean).length;

    // Save metadata
    const metaPath = j(docsDir, 'metadata.json');
    let metadata: Record<string, any> = {};
    if (ex(metaPath)) {
      try { metadata = JSON.parse(await rf(metaPath, 'utf-8')); } catch { /* ok */ }
    }
    metadata[filename] = {
      wordCount,
      uploadedAt: new Date().toISOString(),
      size: req.file.size,
    };
    await wf(metaPath, JSON.stringify(metadata, null, 2));

    res.json({
      success: true,
      filename,
      wordCount,
      size: req.file.size,
      library: true,
      preview: textContent.substring(0, 200),
    });
  });

  // Delete a document from the library
  app.delete('/api/documents/:filename', async (req: Request, res: Response) => {
    const { join: j } = await import('path');
    const { unlink, readFile: rf, writeFile: wf } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');

    const filename = String(req.params.filename);
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const docsDir = j(baseDir, 'workspace', 'documents');
    const filePath = j(docsDir, filename);

    if (!ex(filePath)) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await unlink(filePath);

    // Also delete extracted text if it exists
    const extractedPath = j(docsDir, filename.replace(/\.docx$/i, '.extracted.txt'));
    if (ex(extractedPath) && extractedPath !== filePath) {
      try { await unlink(extractedPath); } catch { /* ok */ }
    }

    // Update metadata
    const metaPath = j(docsDir, 'metadata.json');
    if (ex(metaPath)) {
      try {
        const metadata = JSON.parse(await rf(metaPath, 'utf-8'));
        delete metadata[filename];
        await wf(metaPath, JSON.stringify(metadata, null, 2));
      } catch { /* ok */ }
    }

    res.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════
  // Document Upload (project-level + auto-library for large files)
  // ═══════════════════════════════════════════════════════════

  const upload = multer({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max (up from 10MB for novel uploads)
    fileFilter: (_req, file, cb) => {
      const allowed = ['.txt', '.md', '.docx'];
      const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`File type "${ext}" not supported. Use .txt, .md, or .docx`));
      }
    },
    storage: multer.memoryStorage(),
  });

  app.post('/api/projects/:id/upload', upload.single('file'), async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    const project = engine.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { join: j } = await import('path');
    const { mkdir: mkd, writeFile: wf, readFile: rf } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');

    let textContent = '';
    const filename = req.file.originalname;
    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext === 'txt' || ext === 'md') {
      textContent = req.file.buffer.toString('utf-8');
    } else if (ext === 'docx') {
      // Extract text from docx — unzip the archive and parse word/document.xml
      try {
        const AdmZip = (await import('adm-zip')).default;
        const zip = new AdmZip(req.file.buffer);
        const docEntry = zip.getEntry('word/document.xml');
        if (docEntry) {
          const xml = docEntry.getData().toString('utf-8');
          // Extract text from <w:t> tags, preserving paragraph breaks
          const paragraphs: string[] = [];
          const paraMatches = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
          for (const para of paraMatches) {
            const textParts = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
            if (textParts) {
              const line = textParts.map(t => t.replace(/<[^>]+>/g, '')).join('');
              if (line.trim()) paragraphs.push(line);
            }
          }
          textContent = paragraphs.join('\n\n');
          if (!textContent.trim()) {
            textContent = '[Empty document — no text found in .docx]';
          }
        } else {
          textContent = '[Could not find document content in .docx — file may be corrupted]';
        }
      } catch (e) {
        textContent = '[Failed to parse .docx file: ' + String(e) + ']';
      }
    }

    // Save the file to project upload directory
    const projectSlug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const uploadDir = j(baseDir, 'workspace', 'projects', projectSlug, 'uploads');
    await mkd(uploadDir, { recursive: true });
    await wf(j(uploadDir, filename), req.file.buffer);

    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const LARGE_THRESHOLD = 15000; // 15K words = "large" manuscript
    const isLarge = wordCount > LARGE_THRESHOLD;

    // For large manuscripts (15K+ words): save to centralized document library
    // The full text stays on disk — only smart excerpts go into AI context
    if (isLarge) {
      const docsDir = j(baseDir, 'workspace', 'documents');
      await mkd(docsDir, { recursive: true });

      // Save the extracted text to the library for fast access at execution time
      const textFilename = filename.replace(/\.\w+$/, '.txt');
      await wf(j(docsDir, textFilename), textContent);
      // Save original file too
      await wf(j(docsDir, filename), req.file.buffer);

      // Save metadata
      const metaPath = j(docsDir, 'metadata.json');
      let metadata: Record<string, any> = {};
      if (ex(metaPath)) {
        try { metadata = JSON.parse(await rf(metaPath, 'utf-8')); } catch { /* ok */ }
      }
      metadata[textFilename] = {
        wordCount,
        uploadedAt: new Date().toISOString(),
        size: textContent.length,
        originalFilename: filename,
        projectId: project.id,
      };
      await wf(metaPath, JSON.stringify(metadata, null, 2));

      console.log(`  📚 Large manuscript saved to document library: ${textFilename} (${wordCount.toLocaleString()} words)`);
    }

    // Store upload info in project context
    if (!project.context.uploads) project.context.uploads = [];
    project.context.uploads.push({
      filename,
      wordCount,
      preview: textContent.substring(0, 500),
      uploadedAt: new Date().toISOString(),
      isLarge,
      libraryFile: isLarge ? filename.replace(/\.\w+$/, '.txt') : undefined,
    });

    // Store document content for AI steps
    // For large documents: store reference path (read from disk at execution time)
    // For small documents: store inline (same as before)
    if (isLarge) {
      // Store the path for on-demand reading at execution time
      const textFilename = filename.replace(/\.\w+$/, '.txt');
      project.context.documentLibraryFile = j(baseDir, 'workspace', 'documents', textFilename);
      project.context.documentWordCount = wordCount;
      // Store a brief excerpt for the system context (so AI knows what it's working with)
      if (!project.context.uploadedContent) project.context.uploadedContent = '';
      project.context.uploadedContent += `\n\n--- Uploaded: ${filename} (${wordCount.toLocaleString()} words — full text loaded from document library) ---\n`;
      project.context.uploadedContent += textContent.substring(0, 2000);
      project.context.uploadedContent += `\n\n[...${wordCount.toLocaleString()} words total — smart excerpt will be injected at execution time...]\n`;
    } else {
      // Small file: store inline as before
      if (!project.context.uploadedContent) project.context.uploadedContent = '';
      project.context.uploadedContent += `\n\n--- Uploaded: ${filename} ---\n${textContent}`;
    }

    res.json({
      success: true,
      filename,
      wordCount,
      preview: textContent.substring(0, 200),
      isLarge,
      savedToLibrary: isLarge,
    });
  });

  // ── Workspace File Management ──

  app.get('/api/workspace/stats', async (_req: Request, res: Response) => {
    const { join: j } = await import('path');
    const { readdir: rd, stat: st } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');
    const workspaceDir = j(baseDir, 'workspace');

    const stats: Record<string, { files: number; size: number; items?: string[] }> = {};

    async function scanDir(name: string, dirPath: string, listItems = true) {
      if (!ex(dirPath)) { stats[name] = { files: 0, size: 0 }; return; }
      try {
        const entries = await rd(dirPath, { recursive: true });
        let totalSize = 0;
        let fileCount = 0;
        const items: string[] = [];
        for (const entry of entries) {
          try {
            const fp = j(dirPath, String(entry));
            const s = await st(fp);
            if (s.isFile()) { fileCount++; totalSize += s.size; if (listItems) items.push(String(entry)); }
          } catch { /* skip */ }
        }
        stats[name] = { files: fileCount, size: totalSize, items: listItems ? items.slice(0, 50) : undefined };
      } catch { stats[name] = { files: 0, size: 0 }; }
    }

    await Promise.all([
      scanDir('projects', j(workspaceDir, 'projects')),
      scanDir('research', j(workspaceDir, 'research')),
      scanDir('exports', j(workspaceDir, 'exports')),
      scanDir('agent', j(workspaceDir, '.agent'), false),
      scanDir('memory', j(workspaceDir, '.memory'), false),
      scanDir('audio', j(workspaceDir, '.audio')),
    ]);

    const totalFiles = Object.values(stats).reduce((sum, s) => sum + s.files, 0);
    const totalSize = Object.values(stats).reduce((sum, s) => sum + s.size, 0);
    res.json({ totalFiles, totalSize, totalSizeFormatted: (totalSize / 1048576).toFixed(1) + ' MB', breakdown: stats });
  });

  app.delete('/api/workspace/clean', async (req: Request, res: Response) => {
    const { join: j } = await import('path');
    const { rm } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');
    const workspaceDir = j(baseDir, 'workspace');

    const target = String(req.query.target || '');
    const allowed = ['projects', 'research', 'exports', 'audio'];
    if (!allowed.includes(target)) {
      return res.status(400).json({ error: `Target must be one of: ${allowed.join(', ')}` });
    }

    const dirName = target === 'audio' ? '.audio' : target;
    const targetDir = j(workspaceDir, dirName);
    let deleted = 0;

    if (ex(targetDir)) {
      try {
        const { readdir } = await import('fs/promises');
        const entries = await readdir(targetDir);
        deleted = entries.length;
        await rm(targetDir, { recursive: true });
      } catch (e) {
        return res.status(500).json({ error: String(e) });
      }
    }

    res.json({ success: true, target, deleted });
  });

  // ── Project File Listing ──

  app.get('/api/projects/:id/files', async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) return res.status(503).json({ error: 'Project engine not initialized' });
    const project = engine.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { join: j } = await import('path');
    const { readdir: rd, stat: st } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');

    const projectSlug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const projectDir = j(baseDir, 'workspace', 'projects', projectSlug);

    if (!ex(projectDir)) return res.json({ files: [] });

    try {
      const entries = await rd(projectDir);
      const files: Array<{ name: string; size: number; type: string }> = [];
      for (const entry of entries) {
        if (entry === 'uploads') continue; // skip uploads subfolder
        const fullPath = j(projectDir, entry);
        const info = await st(fullPath);
        if (!info.isFile()) continue;
        const ext = entry.split('.').pop()?.toLowerCase() || '';
        files.push({ name: entry, size: info.size, type: ext });
      }
      // Sort: manuscript files first, then by name
      files.sort((a, b) => {
        const aManuscript = a.name.startsWith('manuscript') ? 0 : 1;
        const bManuscript = b.name.startsWith('manuscript') ? 0 : 1;
        if (aManuscript !== bManuscript) return aManuscript - bManuscript;
        return a.name.localeCompare(b.name);
      });
      res.json({ files, projectDir: projectSlug });
    } catch {
      res.json({ files: [] });
    }
  });

  // ── Project File Download ──

  app.get('/api/projects/:id/download/:filename', async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) return res.status(503).json({ error: 'Project engine not initialized' });
    const project = engine.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { join: j, resolve: rv } = await import('path');
    const { existsSync: ex } = await import('fs');

    const filename = String(req.params.filename);
    const projectSlug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const projectDir = j(baseDir, 'workspace', 'projects', projectSlug);
    const filePath = rv(projectDir, filename);

    // Security: ensure the resolved path is inside the project directory
    if (!filePath.startsWith(rv(projectDir))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!ex(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set content disposition for download
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      md: 'text/markdown',
      txt: 'text/plain',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      html: 'text/html',
      json: 'application/json',
      mp3: 'audio/mpeg',
      epub: 'application/epub+zip',
    };
    res.setHeader('Content-Type', mimeTypes[ext || ''] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const { createReadStream } = await import('fs');
    createReadStream(filePath).pipe(res);
  });

  // ── Export single file as DOCX ──
  app.post('/api/projects/:id/export-docx', async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) return res.status(503).json({ error: 'Project engine not initialized' });
    const project = engine.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename is required' });

    const { join: j, resolve: rv } = await import('path');
    const { readFile: rf, writeFile: wf } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');

    const projectSlug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const projectDir = j(baseDir, 'workspace', 'projects', projectSlug);
    const sourcePath = rv(projectDir, String(filename));

    if (!sourcePath.startsWith(rv(projectDir)) || !ex(sourcePath)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    try {
      const content = await rf(sourcePath, 'utf-8');
      const docxName = String(filename).replace(/\.md$/i, '.docx');
      const docxBuffer = await generateDocxBuffer({
        title: project.title,
        author: 'Author',
        content,
      });
      await wf(j(projectDir, docxName), docxBuffer);
      res.json({
        success: true,
        downloadUrl: `/api/projects/${req.params.id}/download/${encodeURIComponent(docxName)}`,
      });
    } catch (err) {
      res.status(500).json({ error: 'DOCX export failed: ' + String(err) });
    }
  });

  // ── Compile Project Files (combine all output files into one document) ──

  app.post('/api/projects/:id/compile', async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.();
    if (!engine) return res.status(503).json({ error: 'Project engine not initialized' });
    const project = engine.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { join: j } = await import('path');
    const { readdir: rd, readFile: rf, writeFile: wf } = await import('fs/promises');
    const { existsSync: ex } = await import('fs');

    const projectSlug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const projectDir = j(baseDir, 'workspace', 'projects', projectSlug);

    if (!ex(projectDir)) return res.status(404).json({ error: 'No project files found' });

    try {
      const entries = await rd(projectDir);
      const sectionContents: string[] = [];
      const isChapterProject = project.type === 'book-production' || project.type === 'novel-pipeline';

      if (isChapterProject) {
        // ── Chapter-based compile (book-production / novel-pipeline) ──
        const writingSteps = project.steps
          .filter((s: any) => s.phase === 'writing' && s.status === 'completed')
          .sort((a: any, b: any) => (a.chapterNumber || 0) - (b.chapterNumber || 0));

        for (const ws of writingSteps) {
          const expectedFile = `${(ws as any).id}-${(ws as any).label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
          const fullPath = j(projectDir, expectedFile);
          if (ex(fullPath)) {
            const raw = await rf(fullPath, 'utf-8');
            const content = raw.replace(/^# .+\n\n/, '');
            sectionContents.push(`## Chapter ${(ws as any).chapterNumber || sectionContents.length + 1}\n\n${content}`);
          }
        }

        // Fallback: find chapter files by filename pattern
        if (sectionContents.length === 0) {
          const chapterFiles = entries
            .filter(f => f.match(/write-chapter-\d+\.md$/))
            .sort((a, b) => {
              const numA = parseInt(a.match(/chapter-(\d+)/)?.[1] || '0');
              const numB = parseInt(b.match(/chapter-(\d+)/)?.[1] || '0');
              return numA - numB;
            });
          for (const cf of chapterFiles) {
            const raw = await rf(j(projectDir, cf), 'utf-8');
            const content = raw.replace(/^# .+\n\n/, '');
            const chNum = parseInt(cf.match(/chapter-(\d+)/)?.[1] || '0');
            sectionContents.push(`## Chapter ${chNum}\n\n${content}`);
          }
        }
      }

      // ── Universal compile: collect ALL step output .md files ──
      if (sectionContents.length === 0) {
        // Get completed steps in order to determine file sequence
        const completedSteps = project.steps
          .filter((s: any) => s.status === 'completed')
          .map((s: any) => ({
            id: s.id,
            label: s.label,
            filename: `${s.id}-${s.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
          }));

        // First: collect files that match completed steps (preserves step order)
        const usedFiles = new Set<string>();
        for (const cs of completedSteps) {
          const fullPath = j(projectDir, cs.filename);
          if (ex(fullPath)) {
            const raw = await rf(fullPath, 'utf-8');
            sectionContents.push(raw.startsWith('# ') ? raw : `## ${cs.label}\n\n${raw}`);
            usedFiles.add(cs.filename);
          }
        }

        // Second: pick up any other .md files not already included (research files, extras)
        const remainingMd = entries
          .filter(f => f.endsWith('.md') && !usedFiles.has(f) && f !== 'manuscript.md' && f !== 'compiled-output.md')
          .sort();
        for (const mf of remainingMd) {
          const raw = await rf(j(projectDir, mf), 'utf-8');
          sectionContents.push(raw);
          usedFiles.add(mf);
        }
      }

      if (sectionContents.length === 0) {
        return res.status(400).json({ error: 'No output files found to compile' });
      }

      // Build compiled document
      const compiledMd = `# ${project.title}\n\n` + sectionContents.join('\n\n---\n\n');
      const outputBaseName = isChapterProject ? 'manuscript' : 'compiled-output';
      await wf(j(projectDir, `${outputBaseName}.md`), compiledMd, 'utf-8');

      // Get persona info for metadata
      const personaId = (project as any).personaId;
      const persona = personaId ? services.personas?.get(personaId) : null;
      const authorName = persona?.penName || 'AuthorClaw';

      const exportFiles = [`${outputBaseName}.md`];

      // Generate DOCX
      try {
        const docxBuffer = await generateDocxBuffer({
          title: project.title,
          author: authorName,
          content: compiledMd,
          authorBio: persona?.bio,
          alsoBy: persona?.alsoBy,
        });
        await wf(j(projectDir, `${outputBaseName}.docx`), docxBuffer);
        exportFiles.push(`${outputBaseName}.docx`);
      } catch { /* DOCX generation is non-fatal */ }

      // Generate EPUB
      try {
        const epubBuffer = await generateEpubBuffer({
          title: project.title,
          author: authorName,
          content: compiledMd,
          description: project.description,
          authorBio: persona?.bio,
        });
        await wf(j(projectDir, `${outputBaseName}.epub`), epubBuffer);
        exportFiles.push(`${outputBaseName}.epub`);
      } catch { /* EPUB generation is non-fatal */ }

      const totalWords = compiledMd.split(/\s+/).length;
      res.json({
        success: true,
        sections: sectionContents.length,
        totalWords,
        files: exportFiles,
        outputName: outputBaseName,
      });
    } catch (err) {
      res.status(500).json({ error: 'Compile failed: ' + String(err) });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // Autonomous Heartbeat Mode
  // ═══════════════════════════════════════════════════════════

  // Get autonomous mode status
  app.get('/api/autonomous/status', (_req: Request, res: Response) => {
    res.json(services.heartbeat.getAutonomousStatus());
  });

  // Enable autonomous mode
  app.post('/api/autonomous/enable', (_req: Request, res: Response) => {
    services.heartbeat.enableAutonomous();
    res.json({ success: true, status: services.heartbeat.getAutonomousStatus() });
  });

  // Disable autonomous mode
  app.post('/api/autonomous/disable', (_req: Request, res: Response) => {
    services.heartbeat.disableAutonomous();
    res.json({ success: true, status: services.heartbeat.getAutonomousStatus() });
  });

  // Pause autonomous mode
  app.post('/api/autonomous/pause', (_req: Request, res: Response) => {
    services.heartbeat.pauseAutonomous();
    res.json({ success: true, status: services.heartbeat.getAutonomousStatus() });
  });

  // Resume autonomous mode
  app.post('/api/autonomous/resume', (_req: Request, res: Response) => {
    services.heartbeat.resumeAutonomous();
    res.json({ success: true, status: services.heartbeat.getAutonomousStatus() });
  });

  // Update autonomous config (interval, max steps, quiet hours)
  app.post('/api/autonomous/config', (req: Request, res: Response) => {
    const { intervalMinutes, maxStepsPerWake, quietHoursStart, quietHoursEnd } = req.body;
    services.heartbeat.updateAutonomousConfig({
      intervalMinutes, maxStepsPerWake, quietHoursStart, quietHoursEnd,
    });
    res.json({ success: true, status: services.heartbeat.getAutonomousStatus() });
  });

  // ── Idle Task Queue (CRUD) + History ──

  // Get task queue (user-configurable) + completed task history
  app.get('/api/autonomous/idle-tasks', async (_req: Request, res: Response) => {
    try {
      const { join: j } = await import('path');
      const { readdir, readFile, stat, writeFile, mkdir } = await import('fs/promises');
      const { existsSync } = await import('fs');

      // Load task queue from config
      const configPath = j(baseDir, 'workspace', '.config', 'idle-tasks.json');
      let queue: any[] = [];
      if (existsSync(configPath)) {
        const raw = await readFile(configPath, 'utf-8');
        queue = JSON.parse(raw).tasks || [];
      } else {
        // Initialize with defaults
        const { DEFAULT_IDLE_TASKS } = await import('../services/idle-tasks-defaults.js');
        queue = DEFAULT_IDLE_TASKS;
        const configDir = j(baseDir, 'workspace', '.config');
        await mkdir(configDir, { recursive: true });
        await writeFile(configPath, JSON.stringify({ tasks: queue }, null, 2), 'utf-8');
      }

      // Load completed task history from .agent directory
      const agentDir = j(baseDir, 'workspace', '.agent');
      const history: any[] = [];
      if (existsSync(agentDir)) {
        const files = await readdir(agentDir);
        const idleFiles = files.filter(f => f.startsWith('idle-') && f.endsWith('.md')).sort().reverse();
        for (const file of idleFiles.slice(0, 20)) {
          const content = await readFile(j(agentDir, file), 'utf-8');
          const fileStat = await stat(j(agentDir, file));
          const titleMatch = content.match(/^# (.+)$/m);
          history.push({
            file,
            title: titleMatch ? titleMatch[1] : file,
            preview: content.substring(0, 300),
            date: fileStat.mtime.toISOString(),
            size: fileStat.size,
          });
        }
      }

      res.json({ queue, history });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load idle tasks: ' + String(err) });
    }
  });

  // Save entire task queue (replace all)
  app.put('/api/autonomous/idle-tasks', async (req: Request, res: Response) => {
    try {
      const { join: j } = await import('path');
      const { writeFile, mkdir } = await import('fs/promises');
      const { tasks } = req.body;
      if (!Array.isArray(tasks)) return res.status(400).json({ error: 'tasks must be an array' });
      const configDir = j(baseDir, 'workspace', '.config');
      await mkdir(configDir, { recursive: true });
      await writeFile(j(configDir, 'idle-tasks.json'), JSON.stringify({ tasks }, null, 2), 'utf-8');
      res.json({ success: true, count: tasks.length });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save idle tasks: ' + String(err) });
    }
  });

  // Add a single task
  app.post('/api/autonomous/idle-tasks', async (req: Request, res: Response) => {
    try {
      const { join: j } = await import('path');
      const { readFile, writeFile, mkdir } = await import('fs/promises');
      const { existsSync } = await import('fs');
      const { label, prompt, enabled } = req.body;
      if (!label || !prompt) return res.status(400).json({ error: 'label and prompt are required' });

      const configPath = j(baseDir, 'workspace', '.config', 'idle-tasks.json');
      let tasks: any[] = [];
      if (existsSync(configPath)) {
        tasks = JSON.parse(await readFile(configPath, 'utf-8')).tasks || [];
      }
      tasks.push({ label, prompt, enabled: enabled !== false });
      const configDir = j(baseDir, 'workspace', '.config');
      await mkdir(configDir, { recursive: true });
      await writeFile(configPath, JSON.stringify({ tasks }, null, 2), 'utf-8');
      res.status(201).json({ success: true, task: tasks[tasks.length - 1], index: tasks.length - 1 });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add idle task: ' + String(err) });
    }
  });

  // Delete a task by index
  app.delete('/api/autonomous/idle-tasks/:index', async (req: Request, res: Response) => {
    try {
      const { join: j } = await import('path');
      const { readFile, writeFile } = await import('fs/promises');
      const { existsSync } = await import('fs');
      const idx = parseInt(String(req.params.index));
      const configPath = j(baseDir, 'workspace', '.config', 'idle-tasks.json');
      if (!existsSync(configPath)) return res.status(404).json({ error: 'No idle tasks configured' });

      const tasks: any[] = JSON.parse(await readFile(configPath, 'utf-8')).tasks || [];
      if (idx < 0 || idx >= tasks.length) return res.status(404).json({ error: 'Task index out of range' });
      const removed = tasks.splice(idx, 1);
      await writeFile(configPath, JSON.stringify({ tasks }, null, 2), 'utf-8');
      res.json({ success: true, removed: removed[0], remaining: tasks.length });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete idle task: ' + String(err) });
    }
  });

  // Download completed idle task file
  app.get('/api/autonomous/idle-tasks/history/:filename', async (req: Request, res: Response) => {
    try {
      const { join: j, resolve: r } = await import('path');
      const { readFile } = await import('fs/promises');
      const { existsSync } = await import('fs');
      const agentDir = j(baseDir, 'workspace', '.agent');
      const filePath = r(agentDir, String(req.params.filename));
      if (!filePath.startsWith(r(agentDir)) || !existsSync(filePath)) {
        return res.status(404).json({ error: 'Idle task file not found' });
      }
      const content = await readFile(filePath, 'utf-8');
      res.json({ content, filename: req.params.filename });
    } catch (err) {
      res.status(500).json({ error: 'Failed to read idle task: ' + String(err) });
    }
  });

  // ── Agent Journal ──
  app.get('/api/agent/journal', (_req: Request, res: Response) => {
    res.json({ journal: services.heartbeat.getJournal() });
  });

  app.get('/api/agent/status', (_req: Request, res: Response) => {
    const autonomousStatus = services.heartbeat.getAutonomousStatus();
    const stats = services.heartbeat.getStats();
    res.json({
      ...autonomousStatus,
      todayWords: stats.todayWords,
      dailyWordGoal: stats.dailyWordGoal,
      streak: stats.streak,
      goalPercent: stats.goalPercent,
    });
  });

  // ── Author OS tools status ──
  app.get('/api/author-os/status', (_req: Request, res: Response) => {
    if (!services.authorOS) {
      return res.json({ tools: [] });
    }
    res.json({ tools: services.authorOS.getStatus() });
  });

  // ── Native Export: Markdown → Word/HTML (no external tools needed) ──
  app.post('/api/author-os/format', async (req: Request, res: Response) => {
    const { inputFile, title, author, formats, outputDir } = req.body;
    if (!inputFile) {
      return res.status(400).json({ error: 'inputFile required' });
    }

    const { join: j, resolve: r, basename: bn } = await import('path');
    const { existsSync: ex } = await import('fs');
    const { readFile: rf, writeFile: wf, mkdir: mkd } = await import('fs/promises');

    const workspaceDir = j(baseDir, 'workspace');

    // Search for the file in workspace → projects → baseDir
    const searchPaths = [
      r(workspaceDir, inputFile),
      r(workspaceDir, 'projects', inputFile),
      r(baseDir, inputFile),
    ];
    // Also search recursively in workspace/projects/*/
    try {
      const { readdirSync } = await import('fs');
      const projectsDir = j(workspaceDir, 'projects');
      if (ex(projectsDir)) {
        for (const sub of readdirSync(projectsDir, { withFileTypes: true })) {
          if (sub.isDirectory()) {
            searchPaths.push(r(projectsDir, sub.name, inputFile));
          }
        }
      }
    } catch { /* ok */ }

    let resolvedInput = '';
    for (const candidate of searchPaths) {
      if (ex(candidate)) { resolvedInput = candidate; break; }
    }

    if (!resolvedInput) {
      return res.status(404).json({ error: 'Input file not found: ' + inputFile + '. Use /files to see available files.' });
    }

    // Security: must be within project
    const resolvedBase = r(baseDir);
    if (!resolvedInput.startsWith(resolvedBase)) {
      return res.status(403).json({ error: 'Input file must be within the AuthorClaw directory' });
    }

    const exportDir = r(workspaceDir, outputDir || 'exports');
    await mkd(exportDir, { recursive: true });

    const content = await rf(resolvedInput, 'utf-8');
    const docTitle = title || bn(resolvedInput, '.md');
    const docAuthor = author || 'AuthorClaw';
    const requestedFormats = formats || ['docx'];
    const results: string[] = [];

    try {
      // ── Word Export (native, using shared docx utility) ──
      if (requestedFormats.includes('docx') || requestedFormats.includes('all')) {
        const buffer = await generateDocxBuffer({ title: docTitle, author: docAuthor, content });
        const outPath = j(exportDir, docTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-') + '.docx');
        await wf(outPath, buffer);
        results.push(outPath);
      }

      // ── HTML Export (native) ──
      if (requestedFormats.includes('html') || requestedFormats.includes('all')) {
        let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docTitle}</title>`;
        html += `<style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;line-height:1.8;color:#333;}h1{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;}h2{margin-top:2em;border-bottom:1px solid #ccc;}</style></head><body>`;
        html += `<h1>${docTitle}</h1><p style="text-align:center;"><em>by ${docAuthor}</em></p><hr>`;
        // Basic markdown → HTML
        const htmlContent = content
          .replace(/^### (.*$)/gm, '<h3>$1</h3>')
          .replace(/^## (.*$)/gm, '<h2>$1</h2>')
          .replace(/^# (.*$)/gm, '<h1>$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>');
        html += `<p>${htmlContent}</p></body></html>`;
        const outPath = j(exportDir, docTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-') + '.html');
        await wf(outPath, html);
        results.push(outPath);
      }

      // ── Plain Text Export ──
      if (requestedFormats.includes('txt') || requestedFormats.includes('all')) {
        const plain = content.replace(/^#{1,3}\s/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
        const outPath = j(exportDir, docTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-') + '.txt');
        await wf(outPath, `${docTitle}\nby ${docAuthor}\n\n${plain}`);
        results.push(outPath);
      }

      res.json({ success: true, files: results, message: `Exported ${results.length} file(s) to ${exportDir}` });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Export failed: ' + String(error) });
    }
  });

  // ── Tool Ingestion: AI reads code, generates SKILL.md ──
  app.post('/api/tools/ingest', async (req: Request, res: Response) => {
    const { code, toolName, filePath, category } = req.body;

    if (!code && !filePath) {
      return res.status(400).json({ error: 'Provide "code" (source string) or "filePath" (relative to Author OS)' });
    }

    let sourceCode = code;

    if (filePath && !code) {
      const { readFile: rf } = await import('fs/promises');
      const { existsSync: ex } = await import('fs');
      const { resolve: r } = await import('path');

      const authorOSPath = services.authorOS?.getBasePath?.();
      if (!authorOSPath) {
        return res.status(400).json({ error: 'Author OS not mounted. Provide code directly.' });
      }

      const resolvedPath = r(authorOSPath, filePath);
      if (!resolvedPath.startsWith(r(authorOSPath))) {
        return res.status(403).json({ error: 'Path must be within Author OS directory' });
      }
      if (!ex(resolvedPath)) {
        return res.status(404).json({ error: `File not found: ${filePath}` });
      }

      sourceCode = await rf(resolvedPath, 'utf-8');
    }

    const targetCategory = category || 'author';
    const ingestPrompt = `You are analyzing source code to create an AuthorClaw SKILL.md file.

Tool name hint: ${toolName || '(infer from code)'}
Target category: ${targetCategory}

Analyze the following source code and generate a complete SKILL.md file with:
1. YAML frontmatter (name, description, triggers, permissions)
2. Detailed usage instructions
3. Input/output documentation
4. Example commands or workflows
5. How AuthorClaw should invoke or reference the tool

Return ONLY the complete SKILL.md content (starting with ---).

Source code:
\`\`\`
${sourceCode.substring(0, 15000)}
\`\`\``;

    try {
      const provider = services.aiRouter.selectProvider('general');
      const result = await services.aiRouter.complete({
        provider: provider.id,
        system: 'You are a technical documentation expert. Generate AuthorClaw SKILL.md files from source code analysis.',
        messages: [{ role: 'user', content: ingestPrompt }],
        maxTokens: 4096,
        temperature: 0.3,
      });

      res.json({
        skillMd: result.text,
        suggestedPath: `skills/${targetCategory}/${(toolName || 'unknown-tool').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/SKILL.md`,
        provider: result.provider,
        tokens: result.tokensUsed,
      });
    } catch (error) {
      res.status(500).json({ error: 'AI analysis failed: ' + String(error) });
    }
  });

  // ── Tool Ingestion: Save generated SKILL.md ──
  app.post('/api/tools/ingest/save', async (req: Request, res: Response) => {
    const { skillMd, skillPath } = req.body;
    if (!skillMd || !skillPath) {
      return res.status(400).json({ error: 'skillMd and skillPath required' });
    }

    const { join: j, resolve: r } = await import('path');
    const { mkdir, writeFile } = await import('fs/promises');

    const fullPath = r(baseDir, skillPath);
    if (!fullPath.startsWith(r(j(baseDir, 'skills')))) {
      return res.status(403).json({ error: 'Can only save skills to the skills/ directory' });
    }

    try {
      await mkdir(j(fullPath, '..'), { recursive: true });
      await writeFile(fullPath, skillMd, 'utf-8');

      await services.skills.loadAll();

      res.json({
        success: true,
        path: skillPath,
        totalSkills: services.skills.getLoadedCount(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save skill: ' + String(error) });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // Author Personas
  // ═══════════════════════════════════════════════════════════
  // IMPORTANT: Static routes (/generate) must be defined BEFORE parameterized routes (/:id)
  // to prevent Express from matching "generate" as an :id parameter.

  app.get('/api/personas', (_req: Request, res: Response) => {
    const personas = services.personas;
    if (!personas) return res.status(503).json({ error: 'Persona service not initialized' });
    res.json({ personas: personas.list() });
  });

  // AI-assisted full persona generation (static route — must precede /:id)
  app.post('/api/personas/generate', async (req: Request, res: Response) => {
    const personas = services.personas;
    if (!personas) return res.status(503).json({ error: 'Persona service not initialized' });
    const { genre, description } = req.body;
    if (!genre) return res.status(400).json({ error: 'genre is required' });

    try {
      const provider = services.aiRouter?.selectProvider('general');
      if (!provider) return res.status(503).json({ error: 'No AI provider available. Configure an API key in Settings first.' });
      const result = await services.aiRouter.complete({
        provider: provider.id,
        system: 'You are a publishing industry expert. Return ONLY valid JSON, no markdown.',
        messages: [{
          role: 'user' as const,
          content: `Create an author persona for someone who writes ${genre}. ${description || ''}\n\nReturn JSON with these fields:\n- penName: a believable pen name for this genre\n- genre: the main genre\n- subGenre: a specific subgenre\n- voiceDescription: 1-2 sentences describing their writing voice/style\n- styleMarkers: array of 3-5 style descriptors (e.g. "witty dialogue", "slow burn")\n- bio: a 2-3 sentence author bio in third person\n\nReturn ONLY the JSON object.`,
        }],
        maxTokens: 500,
      });
      if (result.text) {
        const cleaned = result.text.replace(/```json\n?|```\n?/g, '').trim();
        const generated = JSON.parse(cleaned);
        const persona = await personas.create({
          penName: generated.penName || 'New Author',
          genre: generated.genre || genre,
          subGenre: generated.subGenre || '',
          voiceDescription: generated.voiceDescription || '',
          styleMarkers: generated.styleMarkers || [],
          bio: generated.bio || '',
        });
        res.status(201).json(persona);
      } else {
        res.status(500).json({ error: 'AI returned empty response' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate persona: ' + String(err) });
    }
  });

  // Create persona (static route — must precede /:id)
  app.post('/api/personas', async (req: Request, res: Response) => {
    const personas = services.personas;
    if (!personas) return res.status(503).json({ error: 'Persona service not initialized' });
    const { penName } = req.body;
    if (!penName || typeof penName !== 'string') {
      return res.status(400).json({ error: 'penName is required' });
    }
    try {
      const persona = await personas.create(req.body);
      res.status(201).json(persona);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create persona: ' + String(err) });
    }
  });

  // Parameterized persona routes (/:id)
  app.get('/api/personas/:id', (req: Request, res: Response) => {
    const personas = services.personas;
    if (!personas) return res.status(503).json({ error: 'Persona service not initialized' });
    const persona = personas.get(req.params.id);
    if (!persona) return res.status(404).json({ error: 'Persona not found' });
    res.json(persona);
  });

  app.put('/api/personas/:id', async (req: Request, res: Response) => {
    const personas = services.personas;
    if (!personas) return res.status(503).json({ error: 'Persona service not initialized' });
    try {
      const updated = await personas.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Persona not found' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update persona: ' + String(err) });
    }
  });

  app.delete('/api/personas/:id', async (req: Request, res: Response) => {
    const personas = services.personas;
    if (!personas) return res.status(503).json({ error: 'Persona service not initialized' });
    const deleted = await personas.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Persona not found' });
    res.json({ success: true });
  });

  // AI-assisted bio generation for existing persona
  app.post('/api/personas/:id/generate-bio', async (req: Request, res: Response) => {
    const personas = services.personas;
    if (!personas) return res.status(503).json({ error: 'Persona service not initialized' });
    const persona = personas.get(req.params.id);
    if (!persona) return res.status(404).json({ error: 'Persona not found' });

    try {
      const provider = services.aiRouter?.selectProvider('general');
      if (!provider) return res.status(503).json({ error: 'No AI provider available. Configure an API key in Settings first.' });
      const result = await services.aiRouter.complete({
        provider: provider.id,
        system: 'You are a publishing industry expert who creates compelling author bios.',
        messages: [{
          role: 'user' as const,
          content: `Write a professional author bio for a pen name "${persona.penName}" who writes ${persona.genre}${persona.subGenre ? ' (' + persona.subGenre + ')' : ''}. Style: ${persona.voiceDescription || 'engaging and professional'}. Style markers: ${persona.styleMarkers.join(', ') || 'none specified'}. Write in third person, 2-3 sentences, suitable for the back of a book. Return ONLY the bio text.`,
        }],
        maxTokens: 300,
      });
      if (result.text) {
        await personas.update(persona.id, { bio: result.text.trim() });
        res.json({ bio: result.text.trim() });
      } else {
        res.status(500).json({ error: 'AI returned empty response' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate bio: ' + String(err) });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // Internet Research (web search + content extraction)
  // ═══════════════════════════════════════════════════════════

  // ── Research Domain Management ──
  app.get('/api/research/domains', (_req: Request, res: Response) => {
    const research = services.research;
    if (!research) {
      return res.status(503).json({ error: 'Research gate not initialized' });
    }
    res.json({ domains: research.getAllowedDomains() });
  });

  app.post('/api/research/domains', async (req: Request, res: Response) => {
    const research = services.research;
    if (!research) {
      return res.status(503).json({ error: 'Research gate not initialized' });
    }
    const { domains } = req.body;
    if (!Array.isArray(domains)) {
      return res.status(400).json({ error: 'domains must be an array of strings' });
    }
    try {
      await research.setDomains(domains);
      res.json({ success: true, count: research.getAllowedDomainCount() });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save domains: ' + String(err) });
    }
  });

  app.post('/api/research', async (req: Request, res: Response) => {
    const research = services.research;
    if (!research) {
      return res.status(503).json({ error: 'Research service not initialized' });
    }
    const { query, maxResults } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query required' });
    }

    try {
      // Search
      const searchResults = await research.search(query, maxResults || 5);

      // If search returned an error, pass it through
      if (searchResults.error && searchResults.results.length === 0) {
        return res.json({
          results: [],
          blocked: searchResults.blocked,
          totalFound: 0,
          error: searchResults.error,
        });
      }

      // Fetch and extract top 3 allowed results
      const enriched = await Promise.all(
        searchResults.results.slice(0, 3).map(async (r: any) => {
          const extracted = await research.fetchAndExtract(r.url);
          return {
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            fullText: extracted.ok ? extracted.text?.substring(0, 5000) : undefined,
          };
        })
      );

      res.json({
        results: enriched,
        blocked: searchResults.blocked,
        totalFound: searchResults.results.length,
        error: searchResults.error,
      });
    } catch (error) {
      res.status(500).json({ error: 'Research failed: ' + String(error) });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // Image Generation (Together AI + OpenAI)
  // ═══════════════════════════════════════════════════════════

  // Generate an image from a text prompt
  app.post('/api/images/generate', async (req: Request, res: Response) => {
    const imageGen = gateway.getImageGen?.();
    if (!imageGen) return res.status(503).json({ error: 'Image generation service not initialized' });

    const { prompt, provider, width, height, style } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    try {
      const result = await imageGen.generate(prompt, { provider, width, height, style });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Image generation failed: ' + String(err) });
    }
  });

  // Generate a book cover
  app.post('/api/images/book-cover', async (req: Request, res: Response) => {
    const imageGen = gateway.getImageGen?.();
    if (!imageGen) return res.status(503).json({ error: 'Image generation service not initialized' });

    const { title, author, genre, description, style } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    try {
      const result = await imageGen.generateBookCover({
        title: title || 'Untitled',
        author: author || 'AuthorClaw',
        genre: genre || 'fiction',
        description,
        style,
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Book cover generation failed: ' + String(err) });
    }
  });

  // Check available image providers
  app.get('/api/images/providers', async (_req: Request, res: Response) => {
    const imageGen = gateway.getImageGen?.();
    if (!imageGen) return res.status(503).json({ error: 'Image generation service not initialized' });
    const providers = await imageGen.getAvailableProviders();
    res.json({ providers });
  });

  // Serve generated images
  app.get('/api/images/:filename', async (req: Request, res: Response) => {
    const imageGen = gateway.getImageGen?.();
    if (!imageGen) return res.status(503).json({ error: 'Image generation service not initialized' });

    const { join: j } = await import('path');
    const { existsSync: ex } = await import('fs');
    const fname = String(req.params.filename);
    const filePath = j(imageGen.getImageDir(), fname);

    if (!ex(filePath) || !fname.match(/^cover-[a-f0-9]+\.png$/)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.sendFile(filePath);
  });

  // ═══════════════════════════════════════════════════════════
  // TTS / Audio (Microsoft Edge TTS — free neural voices)
  // ═══════════════════════════════════════════════════════════

  // Generate audio from text
  app.post('/api/audio/generate', async (req: Request, res: Response) => {
    const { text, voice, rate, pitch, volume } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text required' });
    }
    if (text.length > 50000) {
      return res.status(400).json({ error: 'Text too long (max 50,000 chars)' });
    }

    if (!services.tts) {
      return res.status(503).json({ error: 'TTS service not initialized' });
    }

    const result = await services.tts.generate(text, { voice, rate, pitch, volume });
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  });

  // Serve generated audio files
  app.get('/api/audio/file/:filename', async (req: Request, res: Response) => {
    const { join: j } = await import('path');
    const { existsSync: ex } = await import('fs');
    const fname = String(req.params.filename);
    const filePath = j(baseDir, 'workspace', 'audio', fname);

    // Security: prevent path traversal
    if (fname.includes('..') || fname.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    if (!ex(filePath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const ext = fname.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      wav: 'audio/wav',
    };
    res.setHeader('Content-Type', mimeTypes[ext || ''] || 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${fname}"`);
    const { createReadStream } = await import('fs');
    createReadStream(filePath).pipe(res);
  });

  // List available voice presets
  app.get('/api/audio/voices', async (_req: Request, res: Response) => {
    const { TTSService } = await import('../services/tts.js');
    const activeVoice = services.tts?.getActiveVoice() || 'en-US-AriaNeural';
    res.json({
      available: true,
      activeVoice,
      presets: TTSService.VOICE_PRESETS,
    });
  });

  // Get/set the active voice
  app.get('/api/audio/voice', async (_req: Request, res: Response) => {
    res.json({ voice: services.tts?.getActiveVoice() || 'en-US-AriaNeural' });
  });

  app.post('/api/audio/voice', async (req: Request, res: Response) => {
    const { voice } = req.body;
    if (!voice || typeof voice !== 'string') {
      return res.status(400).json({ error: 'voice is required (e.g., "narrator_female" or "en-US-AriaNeural")' });
    }
    if (!services.tts) {
      return res.status(503).json({ error: 'TTS service not initialized' });
    }
    // Resolve preset name to voice ID before saving
    const resolvedVoice = services.tts.resolveVoice(voice);
    await services.tts.setVoice(resolvedVoice);
    res.json({ success: true, voice: resolvedVoice, message: `Voice set to ${resolvedVoice}. This persists across restarts.` });
  });
}
```
