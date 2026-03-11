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
### getProjectEngine
返回项目引擎类
```ts
  getProjectEngine(): ProjectEngine {
    return this.projectEngine;
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
### createProject
```ts
  createProject(
    type: ProjectType,
    title: string,
    description: string,
    context?: Record<string, any>
  ): Project {
    // 项目ID nextId递增
    const id = `project-${this.nextId++}`;
    const now = new Date().toISOString();

    // Find matching template
    // 根据模版类型找到匹配的项目模版
    const template = PROJECT_TEMPLATES.find(t => t.type === type);

    let steps: ProjectStep[];

    if (template) {
      console.log(`  Project "${title}": using template "${type}" with ${template.steps.length} steps`);
      steps = template.steps.map((s, i) => ({
        id: `${id}-step-${i + 1}`, // 项目ID+步骤ID
        label: s.label, // 步骤标签
        skill: s.skill, // 步骤对应的skill
        toolSuggestion: s.toolSuggestion,
        taskType: s.taskType,
        // 步骤提示词，根据标题和描述填充模版
        prompt: this.expandTemplate(s.promptTemplate, { title, description, ...context }),
        status: 'pending' as const, // 步骤状态
      }));
    } else {
      // Custom project — single step with the user's description
      console.warn(`  Project "${title}": no template found for type "${type}" — creating single-step project`);
      steps = [{
        id: `${id}-step-1`,
        label: title,
        taskType: this.inferTaskType(description),
        prompt: description,
        status: 'pending',
      }];
    }

    // Enhance steps with Author OS tool suggestions if available
    if (this.authorOS) {
      steps = this.enhanceWithAuthorOS(steps);
    }

    const project: Project = {
      id,
      type,
      title,
      description,
      status: 'pending',
      progress: 0,
      steps,
      createdAt: now,
      updatedAt: now,
      context: context || {},
    };

    this.projects.set(id, project);
    this.persistState();
    return project;
  }
```
### expandTemplate
```ts
  private expandTemplate(template: string, vars: Record<string, any>): string {
    let result = template;
    // 遍历按 字段 填充模版
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === 'string') {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
    }
    // Clean up any remaining unexpanded vars
    result = result.replace(/\{\{[^}]+\}\}/g, '');
    return result;
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
## API 接口流程
### 创建项目
```ts
  app.post('/api/projects/create', async (req: Request, res: Response) => {
    const engine = gateway.getProjectEngine?.(); // 获取项目引擎类
    if (!engine) {
      return res.status(503).json({ error: 'Project engine not initialized' });
    }
    // 接口请求传参，
    // type 模版类型(比如book-planning)
    // title 标题 
    // description 描述 
    // personaId 作者笔名ID
    // preferredProvider 大模型
    const { type, title, description, context, planning, config, personaId, preferredProvider } = req.body;
    // 标题和描述必传
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description required' });
    }

    // Helper to set optional fields on newly created projects
    // 设置项目的作者笔名ID 和 大模型
    const applyProjectOptions = (project: any) => {
      if (personaId) project.personaId = personaId;
      if (preferredProvider) project.preferredProvider = preferredProvider;
    };

    // Novel pipeline: use dedicated pipeline builder
    // Trust the explicitly-sent type; only infer from description if no type provided
    // 如果模版类型type没传就根据描述推断出该用哪个模版类型
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
    // 项目引擎类创建项目
    const project = engine.createProject(projectType, title, description, context);
    applyProjectOptions(project);
    res.json({ project, planning: 'template' });
  });
```
