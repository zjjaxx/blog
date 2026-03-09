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
    const premiumCount = this.skills.getPremiumSkillCount();
    const premiumLabel = premiumCount > 0 ? `, ${premiumCount} premium ★` : '';
    console.log(`  ✓ Skills: ${this.skills.getLoadedCount()} loaded (${this.skills.getAuthorSkillCount()} author-specific${premiumLabel})`);

    // ── Phase 6a: Auto-generate SKILLS.txt reference file ──
    try {
      const skillsRefPath = join(ROOT_DIR, 'workspace', 'SKILLS.txt');
      const catalog = this.skills.getSkillCatalog();
      const byCategory = this.skills.getSkillsByCategory();
      let refContent = 'AUTHORCLAW SKILLS REFERENCE\n';
      refContent += `Auto-generated on startup — ${catalog.length} skills loaded\n`;
      refContent += '═'.repeat(60) + '\n\n';

      for (const category of ['core', 'author', 'marketing', 'premium']) {
        const skills = byCategory[category];
        if (!skills || skills.length === 0) continue;

        const label = category.charAt(0).toUpperCase() + category.slice(1);
        const extra = category === 'premium' ? ' ★' : '';
        refContent += `── ${label} Skills (${skills.length})${extra} ──\n\n`;

        for (const skill of skills) {
          const catalogEntry = catalog.find(c => c.name === skill.name);
          const triggers = catalogEntry?.triggers?.join(', ') || '';
          refContent += `  ${skill.name}\n`;
          refContent += `    ${skill.description}\n`;
          if (triggers) refContent += `    Keywords: ${triggers}\n`;
          refContent += '\n';
        }
      }

      await fs.writeFile(skillsRefPath, refContent, 'utf-8');
      console.log(`  ✓ SKILLS.txt auto-updated (${catalog.length} skills)`);
    } catch (e) {
      console.log(`  ⚠ Failed to update SKILLS.txt: ${e}`);
    }

    // ── Phase 6b: Author OS Tools ──
    // Check multiple locations: Docker mount, env var, home dir, or relative to project
    const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
    const authorOSCandidates = [
      '/app/author-os',                                           // Docker
      process.env.AUTHOR_OS_PATH || '',                           // Explicit env var
      join(homeDir, 'author-os'),                                 // ~/author-os (VM)
      join(ROOT_DIR, '..', 'Author OS'),                          // Sibling to AuthorClaw project
      join(ROOT_DIR, '..', '..', 'Author OS'),                    // Automations/Author OS/
    ].filter(Boolean);
    const authorOSPath = authorOSCandidates.find(p => existsSync(p)) || authorOSCandidates[2];
    this.authorOS = new AuthorOSService(authorOSPath);
    await this.authorOS.initialize();
    const osTools = this.authorOS.getAvailableTools();
    if (osTools.length > 0) {
      console.log(`  ✓ Author OS: ${osTools.length} tools (${osTools.join(', ')})`);
    } else {
      console.log('  ⚠ Author OS: no tools found (mount to /app/author-os or ~/author-os)');
    }

    // ── Phase 6c: TTS Service (Piper) — silent init, optional feature ──
    this.tts = new TTSService(join(ROOT_DIR, 'workspace'));
    await this.tts.initialize();

    // ── Phase 6c2: Image Generation Service ──
    this.imageGen = new ImageGenService(join(ROOT_DIR, 'workspace'), this.vault);
    await this.imageGen.initialize();

    // ── Phase 6d: Author Personas ──
    this.personas = new PersonaService(join(ROOT_DIR, 'workspace'));
    await this.personas.initialize();
    console.log(`  ✓ Personas: ${this.personas.getCount()} author persona(s) loaded`);

    // ── Phase 6e: Project Engine ──
    this.projectEngine = new ProjectEngine(this.authorOS, ROOT_DIR);
    // Wire AI capabilities for dynamic planning
    this.projectEngine.setAI(
      (request) => this.aiRouter.complete(request),
      (taskType) => this.aiRouter.selectProvider(taskType)
    );
    const templates = this.projectEngine.getTemplates();
    console.log(`  ✓ Project engine: ${templates.length} templates + dynamic AI planning`);

    // ── Phase 7: Heartbeat ──
    this.heartbeat = new HeartbeatService(this.config.get('heartbeat'), this.memory);

    // Wire autonomous mode — heartbeat can now trigger project steps on a schedule
    const commandHandlers = this.buildTelegramCommandHandlers();
    this.heartbeat.setAutonomous(
      // Run one project step (reuses the same logic as Telegram /project command)
      async (projectId: string) => commandHandlers.startAndRunProject(projectId),
      // List projects with remaining step counts
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
      (message: string) => {
        this.io.emit('autonomous-status', { message, timestamp: new Date().toISOString() });
        if (this.telegram) {
          this.telegram.broadcastToAllowed?.(message);
        }
      },
      // Self-improvement analysis callback
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

    this.heartbeat.start();
    const autonomousLabel = this.config.get('heartbeat.autonomousEnabled')
      ? ` + autonomous every ${this.config.get('heartbeat.autonomousIntervalMinutes', 30)}min`
      : '';
    console.log(`  ✓ Heartbeat: every ${this.config.get('heartbeat.intervalMinutes', 15)} minutes${autonomousLabel}`);

    // ── Phase 8: Bridges ──
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

    // ── Phase 9: API Routes ──
    createAPIRoutes(this.app, this, ROOT_DIR);
    console.log('  ✓ API routes registered');

    // ── Phase 10: WebSocket ──
    this.setupWebSocket();
    console.log('  ✓ WebSocket ready');

    // ── Phase 11: Static Dashboard ──
    const dashboardPath = join(ROOT_DIR, 'dashboard', 'dist');
    this.app.use(express.static(dashboardPath));
    this.app.get('*', (_req, res) => {
      const htmlFile = join(dashboardPath, 'index.html');
      res.sendFile(htmlFile, (err) => {
        if (err) res.status(200).json({ status: 'ok', message: 'AuthorClaw running. Dashboard HTML not found.' });
      });
    });

    // JSON 404 handler — ensures unmatched API routes return JSON not HTML
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