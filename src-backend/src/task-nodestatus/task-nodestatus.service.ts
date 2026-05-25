import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  TaskNodeStatus,
  SubTaskInfo,
  NodeStatus,
  ApprovalMode,
  ApprovalInfo,
  ApprovalCheckResult,
} from './task-nodestatus.model';
import { CreateSubTaskDto } from './dto/create-sub-task.dto';
import { UpdateSubTaskDto } from './dto/update-sub-task.dto';
import { UpdateNodeStatusDto } from './dto/update-node-status.dto';
import { TransitionNodeStatusDto } from './dto/transition-node-status.dto';
import { UpdateApprovalInfoDto } from './dto/update-approval-info.dto';
import { TaskService } from '../task/task.service';
import { WorkflowTypeService } from '../workflow-type/workflow-type.service';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface NodeApprovalConfig {
  mode?: ApprovalMode;
  prompt?: string | null;
  aiReviewMr?: boolean;
  aiReviewMrPrompt?: string | null;
}

interface GiteePullRequestRef {
  owner: string;
  repo: string;
  number: string;
}

interface AiReviewIssue {
  file: string;
  line?: number;
  message: string;
}

@Injectable()
export class TaskNodeStatusService {
  constructor(
    @InjectModel(TaskNodeStatus)
    private taskNodeStatusModel: typeof TaskNodeStatus,
    private readonly taskService: TaskService,
    private readonly workflowTypeService: WorkflowTypeService,
  ) {}

  private async getByTaskAndNode(
    taskId: number,
    nodeId: string,
  ): Promise<TaskNodeStatus> {
    let record = await this.taskNodeStatusModel.findOne({
      where: { taskId, nodeId },
    });
    if (!record) {
      const task = await this.taskService.findOne(taskId);
      if (!task) throw new NotFoundException('Task not found');

      const workflowType = await this.workflowTypeService.findOne(
        task.workflowType,
      );

      record = await this.taskNodeStatusModel.create({
        taskId,
        nodeId,
        workFlowType: workflowType.id,
        node_status: nodeId === 'start' ? 'in_progress' : 'pending',
        maintainerId: null,
        maintainerSchedule: null,
        subTaskList: [],
        approvalInfo: {},
      });

      if (record.node_status === NodeStatus.IN_PROGRESS) {
        const eventsMap = this.normalizeEventsData(workflowType.eventsData);
        await this.triggerNodeEvents(
          taskId,
          eventsMap,
          String(nodeId),
          'onReach',
        );
      }
    }
    return record;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toIdArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) =>
        item !== undefined && item !== null ? String(item) : null,
      )
      .filter((item): item is string => item !== null);
  }

  private normalizeNodesData(
    nodesData: unknown,
  ): Record<
    string,
    {
      prevNodes?: string[];
      nextNodes?: string[];
      approvalConfig?: NodeApprovalConfig;
    }
  > {
    const map: Record<
      string,
      {
        prevNodes?: string[];
        nextNodes?: string[];
        approvalConfig?: NodeApprovalConfig;
      }
    > = {};
    if (!nodesData) return map;
    if (Array.isArray(nodesData)) {
      for (const node of nodesData) {
        if (!this.isRecord(node)) continue;
        const rawId = node.id;
        if (typeof rawId !== 'string' && typeof rawId !== 'number') continue;
        map[String(rawId)] = {
          prevNodes: this.toIdArray(node.prevNodes),
          nextNodes: this.toIdArray(node.nextNodes),
          approvalConfig: this.normalizeApprovalConfig(node.approvalConfig),
        };
      }
      return map;
    }
    if (this.isRecord(nodesData)) {
      for (const [key, rawNode] of Object.entries(nodesData)) {
        if (!this.isRecord(rawNode)) continue;
        map[String(key)] = {
          prevNodes: this.toIdArray(rawNode.prevNodes),
          nextNodes: this.toIdArray(rawNode.nextNodes),
          approvalConfig: this.normalizeApprovalConfig(rawNode.approvalConfig),
        };
      }
      return map;
    }
    return map;
  }

  private normalizeApprovalConfig(value: unknown): NodeApprovalConfig {
    if (!this.isRecord(value)) return { mode: ApprovalMode.NONE };
    const rawMode = value.mode;
    const mode = Object.values(ApprovalMode).includes(rawMode as ApprovalMode)
      ? (rawMode as ApprovalMode)
      : ApprovalMode.NONE;
    return {
      mode,
      prompt: typeof value.prompt === 'string' ? value.prompt : null,
      aiReviewMr: value.aiReviewMr === true,
      aiReviewMrPrompt:
        typeof value.aiReviewMrPrompt === 'string'
          ? value.aiReviewMrPrompt
          : null,
    };
  }

  private getApprovalMode(
    config?: NodeApprovalConfig,
    info?: ApprovalInfo,
  ): ApprovalMode {
    const rawMode = config?.mode || info?.mode || ApprovalMode.NONE;
    return Object.values(ApprovalMode).includes(rawMode)
      ? rawMode
      : ApprovalMode.NONE;
  }

  private buildCheckResult(
    passed: boolean,
    message: string,
    detail?: Record<string, any>,
  ): ApprovalCheckResult {
    return {
      passed,
      message,
      checkedAt: new Date().toISOString(),
      detail,
    };
  }

  private async getRecordWorkflowAndConfig(taskId: number, nodeId: string) {
    const task = await this.taskService.findOne(taskId);
    if (!task) throw new NotFoundException('Task not found');
    const workflowType = await this.workflowTypeService.findOne(
      task.workflowType,
    );
    const nodesMap = this.normalizeNodesData(workflowType.nodesData);
    const nodeKey = String(nodeId);
    const nodeInfo = nodesMap[nodeKey];
    if (!nodeInfo) throw new NotFoundException('Node not found in workflow');
    const record = await this.getByTaskAndNode(taskId, nodeKey);
    return {
      task,
      workflowType,
      nodesMap,
      nodeKey,
      nodeInfo,
      record,
      config: nodeInfo.approvalConfig || { mode: ApprovalMode.NONE },
    };
  }

  private parseGiteePullRequestUrl(url: string) {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('gitee.com')) return null;
      const parts = parsed.pathname.split('/').filter(Boolean);
      const pullIndex = parts.findIndex((part) =>
        ['pulls', 'pull_requests', 'merge_requests'].includes(part),
      );
      if (pullIndex < 2) return null;
      const number = parts[pullIndex + 1];
      if (!number) return null;
      return {
        owner: parts[0],
        repo: parts.slice(1, pullIndex).join('/'),
        number,
      };
    } catch {
      return null;
    }
  }

  private withGiteeAccessToken(url: string) {
    if (!process.env.GITEE_ACCESS_TOKEN) return url;
    const parsed = new URL(url);
    parsed.searchParams.set('access_token', process.env.GITEE_ACCESS_TOKEN);
    return parsed.toString();
  }

  private getGiteeHeaders() {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (process.env.GITEE_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITEE_ACCESS_TOKEN}`;
    }
    return headers;
  }

  private async fetchGiteeJson(url: string, init?: RequestInit) {
    const response = await fetch(this.withGiteeAccessToken(url), {
      ...init,
      headers: {
        ...this.getGiteeHeaders(),
        ...(init?.headers || {}),
      },
    });
    if (!response.ok) {
      throw new BadRequestException(`Gitee API request failed: ${response.status}`);
    }
    return response.json();
  }

  private getGiteePullRequestBase(ref: GiteePullRequestRef) {
    return `https://gitee.com/api/v5/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/pulls/${encodeURIComponent(ref.number)}`;
  }

  private async fetchGiteePullRequestChanges(ref: GiteePullRequestRef) {
    const base = this.getGiteePullRequestBase(ref);
    try {
      const files = await this.fetchGiteeJson(`${base}/files`);
      if (Array.isArray(files)) {
        return files
          .map((file) => ({
            file: String(file.filename || file.new_path || file.path || ''),
            patch: String(file.patch || file.diff || '').slice(0, 12000),
          }))
          .filter((file) => file.file || file.patch);
      }
    } catch {
      return [];
    }
    return [];
  }

  private parseDeepSeekJson(text: string) {
    const trimmed = String(text)
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
    return JSON.parse(trimmed);
  }

  private async requestDeepSeekJson(messages: Array<{ role: string; content: string }>) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('DEEPSEEK_API_KEY is not configured');
    }
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages,
        temperature: 0,
      }),
    });
    if (!response.ok) {
      throw new BadRequestException(`DeepSeek API request failed: ${response.status}`);
    }
    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || '';
    return {
      raw,
      parsed: this.parseDeepSeekJson(raw),
      messages,
    };
  }

  private async createGiteePullRequestComment(
    ref: GiteePullRequestRef,
    issue: AiReviewIssue,
  ) {
    const base = this.getGiteePullRequestBase(ref);
    const body = `[AI review] ${issue.message}`;
    const payloads: Array<Record<string, any>> = [
      {
        body,
        path: issue.file,
        line: issue.line,
      },
      {
        body: `${body}${issue.file ? `\n\nFile: ${issue.file}` : ''}${issue.line ? `:${issue.line}` : ''}`,
      },
    ];

    for (const payload of payloads) {
      try {
        await this.fetchGiteeJson(`${base}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return true;
      } catch {
        // Try the fallback payload.
      }
    }
    return false;
  }

  private async reviewGiteePullRequestWithAi(
    ref: GiteePullRequestRef,
    prompt?: string | null,
  ) {
    const changes = await this.fetchGiteePullRequestChanges(ref);
    if (changes.length === 0) {
      return {
        passed: true,
        issues: [],
        conversation: [],
        raw: '',
        commentedCount: 0,
        message: 'No readable MR changes found for AI review.',
      };
    }
    const messages = [
      {
        role: 'system',
        content:
          '你是一个保守的代码审查卡点助手。只返回 JSON，格式为 {"passed": boolean, "issues": [{"file": string, "line": number, "message": string}]}。message 必须使用中文。只报告有明确证据、足以阻塞流程的确定性问题：代码逻辑错误、安全风险、数据破坏、接口契约破坏或明显运行时错误。不要报告代码风格、命名、格式、轻微可维护性、主观偏好建议或不确定的猜测性问题。',
      },
      {
        role: 'user',
        content: `请按以下卡点策略审查 Gitee MR 变更：\n${prompt || '只有在明确存在严重代码逻辑问题时才判定不通过。如果不确定，请判定通过且不要评论。'}\n\n变更文件和补丁如下：\n${JSON.stringify(changes).slice(0, 50000)}`,
      },
    ];
    const { raw, parsed } = await this.requestDeepSeekJson(messages);
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues
          .map((item) => ({
            file: String(item.file || ''),
            line: item.line ? Number(item.line) : undefined,
            message: String(item.message || ''),
          }))
          .filter((item) => item.message)
      : [];
    let commentedCount = 0;
    for (const issue of issues) {
      if (await this.createGiteePullRequestComment(ref, issue)) {
        commentedCount += 1;
      }
    }
    return {
      passed: issues.length === 0,
      issues,
      conversation: messages,
      raw,
      commentedCount,
      message: issues.length === 0
        ? 'AI code review passed.'
        : 'AI code review found blocking issues.',
    };
  }

  private hasMergeConflict(pullRequest: Record<string, any>) {
    const statusText = [
      pullRequest.merge_status,
      pullRequest.mergeable_state,
      pullRequest.state,
      pullRequest.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (pullRequest.mergeable === false || pullRequest.can_merge === false) {
      return true;
    }
    return statusText.includes('conflict') || statusText.includes('cannot');
  }

  private isCommentUnresolved(comment: Record<string, any>) {
    if (comment.resolved === false || comment.is_resolved === false) return true;
    if (comment.outdated === false && comment.resolved_by_id === null) return true;
    if (comment.state && String(comment.state).toLowerCase() === 'unresolved') {
      return true;
    }
    return false;
  }

  private async checkGiteeMergeRequest(
    url: string | null | undefined,
    aiReviewMr = false,
    aiReviewMrPrompt?: string | null,
  ): Promise<ApprovalCheckResult> {
    if (!url?.trim()) {
      return this.buildCheckResult(false, 'Gitee MR URL is required.');
    }
    const parsed = this.parseGiteePullRequestUrl(url);
    if (!parsed) {
      return this.buildCheckResult(false, 'Invalid Gitee MR URL.');
    }
    const base = this.getGiteePullRequestBase(parsed);
    const pullRequest = await this.fetchGiteeJson(base);
    const comments = (await this.fetchGiteeJson(`${base}/comments`)) as any[];
    const targetBranch = String(pullRequest.base?.ref || pullRequest.target_branch || '');
    const targetIsMain = ['main', 'master'].includes(targetBranch);
    const hasConflict = this.hasMergeConflict(pullRequest);
    const unresolvedComments = Array.isArray(comments)
      ? comments.filter((item) => this.isRecord(item) && this.isCommentUnresolved(item))
      : [];
    const basePassed =
      targetIsMain && !hasConflict && unresolvedComments.length === 0;
    let aiReview:
      | Awaited<ReturnType<typeof this.reviewGiteePullRequestWithAi>>
      | null = null;
    if (!basePassed) {
      return this.buildCheckResult(false, 'Gitee MR basic check failed.', {
        targetBranch,
        hasConflict,
        unresolvedCommentCount: unresolvedComments.length,
        aiReview: null,
        aiReviewSkipped: true,
      });
    }
    if (aiReviewMr) {
      aiReview = await this.reviewGiteePullRequestWithAi(
        parsed,
        aiReviewMrPrompt,
      );
    }
    const passed = !aiReview || aiReview.passed;
    return this.buildCheckResult(
      passed,
      passed
        ? 'Gitee MR check passed.'
        : 'Gitee MR check failed.',
      {
        targetBranch,
        hasConflict,
        unresolvedCommentCount: unresolvedComments.length,
        aiReview,
      },
    );
  }

  private async readTextFromInput(info: ApprovalInfo): Promise<string> {
    const parts: string[] = [];
    if (info.materialUrl?.trim()) {
      try {
        const response = await fetch(info.materialUrl);
        if (response.ok) {
          parts.push(await response.text());
        }
      } catch {
        parts.push(`无法读取链接内容：${info.materialUrl}`);
      }
    }
    if (info.documentUrl?.trim()) {
      try {
        const response = await fetch(info.documentUrl);
        if (response.ok) {
          parts.push(await response.text());
        }
      } catch {
        parts.push(`无法读取文档链接内容：${info.documentUrl}`);
      }
    }
    if (info.attachmentUrl?.startsWith('/uploads/')) {
      try {
        const filePath = join(process.cwd(), info.attachmentUrl.replace(/^\//, ''));
        parts.push(await readFile(filePath, 'utf-8'));
      } catch {
        parts.push(`无法读取附件文本内容：${info.attachmentName || info.attachmentUrl}`);
      }
    }
    return parts.join('\n\n').slice(0, 20000);
  }

  private async checkWithDeepSeek(
    info: ApprovalInfo,
    prompt?: string | null,
  ): Promise<ApprovalCheckResult> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return this.buildCheckResult(false, '未配置 DEEPSEEK_API_KEY');
    }
    if (!info.materialUrl?.trim() && !info.documentUrl?.trim() && !info.attachmentUrl) {
      return this.buildCheckResult(false, '请填写素材链接、文档链接或上传附件');
    }
    const content = await this.readTextFromInput(info);
    if (!content.trim()) {
      return this.buildCheckResult(false, '未能读取到可审查内容');
    }
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是项目流程卡点审批助手。请只返回 JSON，格式为 {"passed": boolean, "message": string}。',
          },
          {
            role: 'user',
            content: `审批提示词：${prompt || '判断材料是否满足当前节点通过条件'}\n\n待审查内容：\n${content}`,
          },
        ],
        temperature: 0,
      }),
    });
    if (!response.ok) {
      return this.buildCheckResult(false, `DeepSeek API 请求失败：${response.status}`);
    }
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(String(text).replace(/^```json|```$/g, '').trim());
      return this.buildCheckResult(Boolean(parsed.passed), parsed.message || 'AI 审查完成', {
        raw: text,
      });
    } catch {
      return this.buildCheckResult(false, 'AI 返回内容无法解析为审批结果', { raw: text });
    }
  }

  private normalizeEventsData(eventsData: unknown): Record<
    string,
    {
      onReach?: Array<{ type?: string; to?: unknown }>;
      onComplete?: Array<{ type?: string; to?: unknown }>;
    }
  > {
    const map: Record<
      string,
      {
        onReach?: Array<{ type?: string; to?: unknown }>;
        onComplete?: Array<{ type?: string; to?: unknown }>;
      }
    > = {};
    if (!eventsData) return map;
    if (!this.isRecord(eventsData)) return map;
    for (const [key, value] of Object.entries(eventsData)) {
      if (!this.isRecord(value)) continue;
      map[String(key)] = {
        onReach: Array.isArray(value.onReach) ? value.onReach : [],
        onComplete: Array.isArray(value.onComplete) ? value.onComplete : [],
      };
    }
    return map;
  }

  private getStatusTransitionTarget(
    events: Array<{ type?: string; to?: unknown }>,
  ): string | null {
    if (!Array.isArray(events) || events.length === 0) return null;
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      if (!event || event.type !== 'status_transition') continue;
      if (typeof event.to === 'string') return event.to;
      if (this.isRecord(event.to) && typeof event.to.id === 'string') {
        return event.to.id;
      }
    }
    return null;
  }

  private async applyStatusTransitionEvent(
    taskId: number,
    targetStatus: string,
  ) {
    const task = await this.taskService.findOne(taskId);
    const list = task.fieldStatusList || [];
    const nextList = [...list];
    const index = nextList.findIndex((item) => item.fieldId === 'status');
    if (index >= 0) {
      nextList[index] = { ...nextList[index], value: targetStatus };
    } else {
      nextList.push({ fieldId: 'status', value: targetStatus });
    }
    task.fieldStatusList = nextList;
    await task.save();
  }

  private async triggerNodeEvents(
    taskId: number,
    eventsMap: Record<
      string,
      {
        onReach?: Array<{ type?: string; to?: unknown }>;
        onComplete?: Array<{ type?: string; to?: unknown }>;
      }
    >,
    nodeId: string,
    eventType: 'onReach' | 'onComplete',
  ) {
    const nodeEvents = eventsMap[nodeId];
    if (!nodeEvents) return;
    const events = nodeEvents[eventType] || [];
    const targetStatus = this.getStatusTransitionTarget(events);
    if (targetStatus === null) return;
    await this.applyStatusTransitionEvent(taskId, targetStatus);
  }

  async listSubTasks(taskId: number, nodeId: string): Promise<SubTaskInfo[]> {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    return record.subTaskList || [];
  }

  async listNodeStatuses(taskId: number) {
    const records = await this.taskNodeStatusModel.findAll({
      where: { taskId },
    });

    return records.map((record) => {
      const json: TaskNodeStatus = record.toJSON();
      return {
        id: json.id,
        taskId: json.taskId,
        nodeId: json.nodeId,
        workFlowType: json.workFlowType,
        node_status: json.node_status,
        maintainerId: json.maintainerId ?? null,
        maintainerSchedule: json.maintainerSchedule ?? null,
        subTaskList: json.subTaskList || [],
        approvalInfo: json.approvalInfo || {},
      };
    });
  }

  async getNodeStatus(taskId: number, nodeId: string) {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    return {
      id: record.id,
      taskId: record.taskId,
      nodeId: record.nodeId,
      workFlowType: record.workFlowType,
      node_status: record.node_status,
      maintainerId: record.maintainerId ?? null,
      maintainerSchedule: record.maintainerSchedule ?? null,
      subTaskList: record.subTaskList || [],
      approvalInfo: record.approvalInfo || {},
    };
  }

  async updateNodeStatus(
    taskId: number,
    nodeId: string,
    dto: UpdateNodeStatusDto,
  ) {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    if (dto.maintainerId !== undefined) {
      record.maintainerId = dto.maintainerId ?? null;
    }
    if (dto.maintainerSchedule !== undefined) {
      record.maintainerSchedule = dto.maintainerSchedule ?? null;
    }
    await record.save();
    return {
      id: record.id,
      taskId: record.taskId,
      nodeId: record.nodeId,
      workFlowType: record.workFlowType,
      node_status: record.node_status,
      maintainerId: record.maintainerId ?? null,
      maintainerSchedule: record.maintainerSchedule ?? null,
      subTaskList: record.subTaskList || [],
      approvalInfo: record.approvalInfo || {},
    };
  }

  async getApprovalInfo(taskId: number, nodeId: string) {
    const { record, config } = await this.getRecordWorkflowAndConfig(
      taskId,
      String(nodeId),
    );
    const info = record.approvalInfo || {};
    return {
      ...info,
      mode: this.getApprovalMode(config, info),
      prompt: config.prompt || '',
      aiReviewMr: config.aiReviewMr === true,
      aiReviewMrPrompt: config.aiReviewMrPrompt || '',
    };
  }

  async updateApprovalInfo(
    taskId: number,
    nodeId: string,
    dto: UpdateApprovalInfoDto,
  ) {
    const { record, config } = await this.getRecordWorkflowAndConfig(
      taskId,
      String(nodeId),
    );
    const current = record.approvalInfo || {};
    record.approvalInfo = {
      ...current,
      ...dto,
      mode: this.getApprovalMode(config, dto),
      lastCheckResult: null,
    };
    await record.save();
    return this.getApprovalInfo(taskId, nodeId);
  }

  async checkApprovalInfo(taskId: number, nodeId: string) {
    const { record, config } = await this.getRecordWorkflowAndConfig(
      taskId,
      String(nodeId),
    );
    const info = record.approvalInfo || {};
    const mode = this.getApprovalMode(config, info);
    let result: ApprovalCheckResult;
    if (mode === ApprovalMode.NONE) {
      result = this.buildCheckResult(true, '无需检查');
    } else if (mode === ApprovalMode.DOCUMENT) {
      result = this.buildCheckResult(
        Boolean(info.documentUrl?.trim()),
        info.documentUrl?.trim() ? '文档链接已填写' : '请填写文档链接',
      );
    } else if (mode === ApprovalMode.MERGE_REQUEST) {
      result = await this.checkGiteeMergeRequest(
        info.giteeMrUrl,
        config.aiReviewMr === true,
        config.aiReviewMrPrompt,
      );
    } else {
      result = await this.checkWithDeepSeek(info, config.prompt);
    }
    record.approvalInfo = {
      ...info,
      mode,
      lastCheckResult: result,
    };
    await record.save();
    return {
      ...record.approvalInfo,
      prompt: config.prompt || '',
      aiReviewMr: config.aiReviewMr === true,
      aiReviewMrPrompt: config.aiReviewMrPrompt || '',
    };
  }

  private async assertApprovalAllowsTransition(taskId: number, nodeId: string) {
    const { record, config } = await this.getRecordWorkflowAndConfig(
      taskId,
      String(nodeId),
    );
    const info = record.approvalInfo || {};
    const mode = this.getApprovalMode(config, info);
    if (mode === ApprovalMode.NONE) return;
    if (mode === ApprovalMode.DOCUMENT) {
      if (!info.documentUrl?.trim()) {
        throw new BadRequestException('请先填写审批文档链接');
      }
      return;
    }
    if (mode === ApprovalMode.MERGE_REQUEST) {
      const result = await this.checkGiteeMergeRequest(
        info.giteeMrUrl,
        config.aiReviewMr === true,
        config.aiReviewMrPrompt,
      );
      record.approvalInfo = {
        ...info,
        mode,
        lastCheckResult: result,
      };
      await record.save();
      if (!result.passed) throw new BadRequestException(result.message);
      return;
    }
    if (!info.lastCheckResult?.passed) {
      throw new BadRequestException('AI 审查未通过或尚未执行');
    }
  }

  async transitionNodeStatus(
    taskId: number,
    nodeId: string,
    dto: TransitionNodeStatusDto,
  ): Promise<{ success: boolean }> {
    const task = await this.taskService.findOne(taskId);
    if (!task) throw new NotFoundException('Task not found');
    const workflowType = await this.workflowTypeService.findOne(
      task.workflowType,
    );
    const nodesMap = this.normalizeNodesData(workflowType.nodesData);
    const eventsMap = this.normalizeEventsData(workflowType.eventsData);
    const nodeKey = String(nodeId);
    const nodeInfo = nodesMap[nodeKey];
    if (!nodeInfo) throw new NotFoundException('Node not found in workflow');

    const record = await this.getByTaskAndNode(taskId, nodeKey);
    const nextNodeIds = this.toIdArray(nodeInfo.nextNodes);

    if (dto.status === NodeStatus.COMPLETED) {
      if (record.node_status !== NodeStatus.IN_PROGRESS) {
        throw new BadRequestException('Node must be in progress to complete');
      }
      await this.assertApprovalAllowsTransition(taskId, nodeKey);
      record.node_status = NodeStatus.COMPLETED;
      await record.save();
      await this.triggerNodeEvents(taskId, eventsMap, nodeKey, 'onComplete');

      for (const nextId of nextNodeIds) {
        const nextInfo = nodesMap[nextId];
        if (!nextInfo) continue;
        const prevNodeIds = this.toIdArray(nextInfo.prevNodes);
        const prevCompleted = await Promise.all(
          prevNodeIds.map(async (prevId) => {
            const prevRecord = await this.getByTaskAndNode(taskId, prevId);
            return prevRecord.node_status === NodeStatus.COMPLETED;
          }),
        );
        if (prevCompleted.every(Boolean)) {
          const nextRecord = await this.getByTaskAndNode(taskId, nextId);
          const wasInProgress =
            nextRecord.node_status === NodeStatus.IN_PROGRESS;
          if (nextRecord.node_status !== NodeStatus.COMPLETED) {
            nextRecord.node_status = NodeStatus.IN_PROGRESS;
            if (!wasInProgress) {
              await nextRecord.save();
              await this.triggerNodeEvents(
                taskId,
                eventsMap,
                nextId,
                'onReach',
              );
            } else {
              await nextRecord.save();
            }
          }
        }
      }

      return { success: true };
    }

    if (dto.status === NodeStatus.IN_PROGRESS) {
      if (record.node_status !== NodeStatus.COMPLETED) {
        throw new BadRequestException('Node must be completed to rollback');
      }
      const visited = new Set<string>();
      const queue = [...nextNodeIds];
      while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId || visited.has(currentId)) continue;
        visited.add(currentId);

        const currentRecord = await this.getByTaskAndNode(taskId, currentId);
        if (currentRecord.node_status !== NodeStatus.PENDING) {
          currentRecord.node_status = NodeStatus.PENDING;
          await currentRecord.save();
        }

        const currentInfo = nodesMap[currentId];
        if (!currentInfo) continue;
        const currentNext = this.toIdArray(currentInfo.nextNodes);
        queue.push(...currentNext);
      }
      record.node_status = NodeStatus.IN_PROGRESS;
      await record.save();
      await this.triggerNodeEvents(taskId, eventsMap, nodeKey, 'onReach');
      return { success: true };
    }

    throw new BadRequestException('Unsupported target status');
  }

  async getSubTask(
    taskId: number,
    nodeId: string,
    name: string,
  ): Promise<SubTaskInfo> {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    const item = (record.subTaskList || []).find((s) => s.name === name);
    if (!item) {
      return { name: '', maintainer: null, schedule: null };
    }
    return item;
  }

  async createSubTask(
    taskId: number,
    nodeId: string,
    dto: CreateSubTaskDto,
  ): Promise<SubTaskInfo[]> {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    const list = record.subTaskList || [];
    if (list.some((s) => s.name === dto.name)) {
      throw new BadRequestException('SubTask already exists');
    }
    list.push({
      name: dto.name,
      maintainer: dto.maintainer ?? null,
      schedule: dto.schedule ?? null,
    });
    record.subTaskList = list;
    await record.save();
    return record.subTaskList || [];
  }

  async updateSubTask(
    taskId: number,
    nodeId: string,
    name: string,
    dto: UpdateSubTaskDto,
  ): Promise<SubTaskInfo> {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    const list = record.subTaskList || [];
    const index = list.findIndex((s) => s.name === name);
    if (index < 0) throw new NotFoundException('SubTask not found');

    const nextName = dto.name ?? list[index].name;
    if (nextName !== name && list.some((s) => s.name === nextName)) {
      throw new BadRequestException('SubTask name already exists');
    }

    list[index] = {
      name: nextName,
      maintainer:
        dto.maintainer !== undefined ? dto.maintainer : list[index].maintainer,
      schedule:
        dto.schedule !== undefined ? dto.schedule : list[index].schedule,
    };
    record.subTaskList = list;
    await record.save();
    return list[index];
  }

  async removeSubTask(
    taskId: number,
    nodeId: string,
    name: string,
  ): Promise<void> {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    const list = record.subTaskList || [];
    const nextList = list.filter((s) => s.name !== name);
    if (nextList.length === list.length) {
      throw new NotFoundException('SubTask not found');
    }
    record.subTaskList = nextList;
    await record.save();
  }
}
