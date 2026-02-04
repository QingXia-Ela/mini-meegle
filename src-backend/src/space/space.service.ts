import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Space } from './space.model';
import { SpaceUser } from '../space-user/space-user.model';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { UpdateOverviewContentDto } from './dto/update-overview-content.dto';
import { generateUniqueId } from '../utils/id-generator';
import { SpacePermission } from '../space-user/space-user-permission.enum';
import {
  INIT_SPACE_MAIN_PAGE_CONTENT,
  INIT_WORK_ITEMS,
  INIT_USER_STORY_WORK_ITEM_FIELDS,
  INIT_BUG_WORK_ITEM_FIELDS,
  INIT_TASK_WORK_ITEM_FIELDS,
  INIT_USER_STORY_WORK_ITEM_ROLES,
  INIT_BUG_WORK_ITEM_ROLES,
  INIT_TASK_WORK_ITEM_ROLES,
  INIT_USER_STORY_WORKFLOW_TYPES,
  INIT_BUG_WORKFLOW_TYPES,
  INIT_TASK_WORKFLOW_TYPES,
  INIT_USER_STORY_TASKS,
  INIT_BUG_TASKS,
  INIT_TASK_TASKS,
} from './INIT';
import { WorkItemService } from '../work-item/work-item.service';
import { WorkItemFieldService } from '../work-item-field/work-item-field.service';
import { WorkItemRoleService } from '../work-item-role/work-item-role.service';
import { WorkflowTypeService } from '../workflow-type/workflow-type.service';
import { TaskService } from '../task/task.service';
import { CreateWorkItemDto } from '../work-item/dto/create-work-item.dto';
import { CreateWorkItemFieldDto } from '../work-item-field/dto/create-work-item-field.dto';
import { CreateWorkItemRoleDto } from '../work-item-role/dto/create-work-item-role.dto';
import { CreateWorkflowTypeDto } from '../workflow-type/dto/create-workflow-type.dto';
import { WorkItem } from '../work-item/work-item.model';
import { WorkItemSpace } from '../work-item/work-item-space.model';
import { WorkItemField } from '../work-item-field/work-item-field.model';
import { WorkItemRole } from '../work-item-role/work-item-role.model';
import { WorkflowType } from '../workflow-type/workflow-type.model';
import { Task } from '../task/task.model';
import { TaskNodeStatus } from '../task-nodestatus/task-nodestatus.model';

@Injectable()
export class SpaceService {
  private static readonly creatingSpaceUsers = new Map<number, true>();

  constructor(
    @InjectModel(Space) private spaceModel: typeof Space,
    @InjectModel(SpaceUser) private spaceUserModel: typeof SpaceUser,
    @InjectModel(WorkItem) private workItemModel: typeof WorkItem,
    @InjectModel(WorkItemSpace)
    private workItemSpaceModel: typeof WorkItemSpace,
    @InjectModel(WorkItemField)
    private workItemFieldModel: typeof WorkItemField,
    @InjectModel(WorkItemRole)
    private workItemRoleModel: typeof WorkItemRole,
    @InjectModel(WorkflowType)
    private workflowTypeModel: typeof WorkflowType,
    @InjectModel(Task) private taskModel: typeof Task,
    @InjectModel(TaskNodeStatus)
    private taskNodeStatusModel: typeof TaskNodeStatus,
    private workItemService: WorkItemService,
    private workItemFieldService: WorkItemFieldService,
    private workItemRoleService: WorkItemRoleService,
    private workflowTypeService: WorkflowTypeService,
    private taskService: TaskService,
  ) {}

  async create(dto: CreateSpaceDto, userId: number): Promise<Space> {
    const sequelize = this.spaceModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    if (SpaceService.creatingSpaceUsers.has(userId)) {
      throw new ForbiddenException('当前已有正在创建的空间请求');
    }
    SpaceService.creatingSpaceUsers.set(userId, true);

    try {
      return await sequelize.transaction(async (transaction) => {
        // 生成唯一ID
        const id = await generateUniqueId(this.spaceModel, 6);

        // 创建空间，明确设置ID
        const space = await this.spaceModel.create(
          {
            ...dto,
            id,
          } as any,
          { transaction },
        );

        // 将创建者添加到空间-用户关系表，并设为管理员
        await this.spaceUserModel.create(
          {
            uid: userId,
            sid: space.id,
            space_permission: SpacePermission.MANAGER,
          },
          { transaction },
        );

        // 初始化空间主页内容
        const overviewContent = JSON.parse(
          INIT_SPACE_MAIN_PAGE_CONTENT,
        ) as Record<string, unknown>;
        space.overviewContent = overviewContent;
        await space.save({ transaction });
        console.log('[!!!] start init work items');

        // 初始化工作项
        const workItemIdMap = new Map<string, string>();
        const workItemKeys = ['userStory', 'bug', 'task'] as const;
        for (const [index, workItem] of INIT_WORK_ITEMS.entries()) {
          const key = workItemKeys[index];
          if (!key) {
            throw new Error('Missing work item key mapping');
          }
          const payload: CreateWorkItemDto = {
            ...workItem,
            sid: space.id,
            id: await generateUniqueId(this.workItemModel, 8),
          };
          const created = await this.workItemService.create(
            payload,
            transaction,
          );
          workItemIdMap.set(key, created.id);
        }
        console.log('[!!!] end init work items');
        console.log('[!!!] start init work item fields');
        // 初始化工作项字段
        const userStoryWid = workItemIdMap.get('userStory');
        const bugWid = workItemIdMap.get('bug');
        const taskWid = workItemIdMap.get('task');
        if (!userStoryWid || !bugWid || !taskWid) {
          throw new Error('Missing work item id seeds');
        }
        for (const field of INIT_USER_STORY_WORK_ITEM_FIELDS) {
          const payload: CreateWorkItemFieldDto & { id: string } = {
            wid: userStoryWid,
            id: field.id,
            name: field.name,
            type: field.type,
            config: field.config,
          };
          await this.workItemFieldService.create(
            userStoryWid,
            payload,
            transaction,
          );
        }
        for (const field of INIT_BUG_WORK_ITEM_FIELDS) {
          const payload: CreateWorkItemFieldDto & { id: string } = {
            wid: bugWid,
            id: field.id,
            name: field.name,
            type: field.type,
            config: field.config,
          };
          await this.workItemFieldService.create(bugWid, payload, transaction);
        }
        for (const field of INIT_TASK_WORK_ITEM_FIELDS) {
          const payload: CreateWorkItemFieldDto & { id: string } = {
            wid: taskWid,
            id: field.id,
            name: field.name,
            type: field.type,
            config: field.config,
          };
          await this.workItemFieldService.create(taskWid, payload, transaction);
        }
        console.log('[!!!] end init work item fields');
        console.log('[!!!] start init work item roles');
        // 初始化工作项角色
        for (const role of INIT_USER_STORY_WORK_ITEM_ROLES) {
          const payload: CreateWorkItemRoleDto & { id: string } = {
            id: role.id,
            name: role.name,
            appearance: role.appearance,
            allocation: role.allocation,
            isSingle: role.isSingle,
            autoJoin: role.autoJoin,
          };
          await this.workItemRoleService.create(
            userStoryWid,
            payload,
            transaction,
          );
        }
        for (const role of INIT_BUG_WORK_ITEM_ROLES) {
          const payload: CreateWorkItemRoleDto & { id: string } = {
            id: role.id,
            name: role.name,
            appearance: role.appearance,
            allocation: role.allocation,
            isSingle: role.isSingle,
            autoJoin: role.autoJoin,
          };
          await this.workItemRoleService.create(bugWid, payload, transaction);
        }
        for (const role of INIT_TASK_WORK_ITEM_ROLES) {
          const payload: CreateWorkItemRoleDto & { id: string } = {
            id: role.id,
            name: role.name,
            appearance: role.appearance,
            allocation: role.allocation,
            isSingle: role.isSingle,
            autoJoin: role.autoJoin,
          };
          await this.workItemRoleService.create(taskWid, payload, transaction);
        }
        console.log('[!!!] end init work item roles');
        console.log('[!!!] start init workflow types');
        // 初始化工作流类型
        const userStoryWorkflowTypes: Array<{ id: number; name: string }> = [];
        for (const workflow of INIT_USER_STORY_WORKFLOW_TYPES) {
          const payload: CreateWorkflowTypeDto = {
            ...workflow,
            wid: userStoryWid,
          };
          const created = await this.workflowTypeService.create(
            payload,
            transaction,
          );
          userStoryWorkflowTypes.push({ id: created.id, name: workflow.name });
        }
        const bugWorkflowTypes: Array<{ id: number }> = [];
        for (const workflow of INIT_BUG_WORKFLOW_TYPES) {
          const payload: CreateWorkflowTypeDto = {
            ...workflow,
            wid: bugWid,
          };
          const created = await this.workflowTypeService.create(
            payload,
            transaction,
          );
          bugWorkflowTypes.push(created);
        }
        const taskWorkflowTypes: Array<{ id: number }> = [];
        for (const workflow of INIT_TASK_WORKFLOW_TYPES) {
          const payload: CreateWorkflowTypeDto = {
            ...workflow,
            wid: taskWid,
          };
          const created = await this.workflowTypeService.create(
            payload,
            transaction,
          );
          taskWorkflowTypes.push(created);
        }
        console.log('[!!!] end init workflow types');
        console.log('[!!!] start init tasks');
        // 初始化任务（创建者为当前创建空间的用户）
        if (userStoryWorkflowTypes.length === 0) {
          throw new Error('Missing user story workflow type seeds');
        }
        const standardUserStoryWorkflow = userStoryWorkflowTypes.find(
          (item) => item.name === '标准业务开发流程',
        );
        if (!standardUserStoryWorkflow) {
          throw new Error('Missing 标准业务开发流程 workflow type seed');
        }
        const userStoryWorkflowTypeId = standardUserStoryWorkflow.id;
        for (const task of INIT_USER_STORY_TASKS) {
          await this.taskService.create(
            {
              ...task,
              wid: userStoryWid,
              workflowType: userStoryWorkflowTypeId,
            },
            userId,
            transaction,
          );
        }
        if (bugWorkflowTypes.length === 0) {
          throw new Error('Missing bug workflow type seeds');
        }
        const bugWorkflowTypeId = bugWorkflowTypes[0].id;
        for (const task of INIT_BUG_TASKS) {
          await this.taskService.create(
            {
              ...task,
              wid: bugWid,
              workflowType: bugWorkflowTypeId,
            },
            userId,
            transaction,
          );
        }
        if (taskWorkflowTypes.length === 0) {
          throw new Error('Missing task workflow type seeds');
        }
        const taskWorkflowTypeId = taskWorkflowTypes[0].id;
        for (const task of INIT_TASK_TASKS) {
          await this.taskService.create(
            {
              ...task,
              wid: taskWid,
              workflowType: taskWorkflowTypeId,
            },
            userId,
            transaction,
          );
        }
        console.log('[!!!] end init tasks');
        return space;
      });
    } catch (error) {
      console.error('[!!!] error: ', error);
      throw error;
    } finally {
      SpaceService.creatingSpaceUsers.delete(userId);
    }
  }

  async findAll(): Promise<Space[]> {
    return this.spaceModel.findAll();
  }

  async findOne(id: string): Promise<Space> {
    const s = await this.spaceModel.findByPk(id);
    if (!s) throw new NotFoundException('Space not found');
    return s;
  }

  async update(id: string, dto: UpdateSpaceDto): Promise<Space> {
    const s = await this.findOne(id);
    return s.update(dto as any);
  }

  async remove(id: string): Promise<void> {
    const sequelize = this.spaceModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    await sequelize.transaction(async (transaction) => {
      const space = await this.spaceModel.findByPk(id, { transaction });
      if (!space) throw new NotFoundException('Space not found');

      const workItems = await this.workItemModel.findAll({
        where: { sid: id },
        attributes: ['id'],
        transaction,
      });
      const workItemIds = workItems.map((item) => item.id);

      let workflowTypeIds: number[] = [];
      if (workItemIds.length > 0) {
        const workflowTypes = await this.workflowTypeModel.findAll({
          where: { wid: { [Op.in]: workItemIds } },
          attributes: ['id'],
          transaction,
        });
        workflowTypeIds = workflowTypes.map((item) => item.id);
      }

      let taskIds: number[] = [];
      if (workItemIds.length > 0) {
        const tasks = await this.taskModel.findAll({
          where: { wid: { [Op.in]: workItemIds } },
          attributes: ['id'],
          transaction,
        });
        taskIds = tasks.map((task) => task.id);
      }

      if (taskIds.length > 0) {
        await this.taskNodeStatusModel.destroy({
          where: { taskId: { [Op.in]: taskIds } },
          transaction,
        });
      }

      if (workflowTypeIds.length > 0) {
        await this.taskNodeStatusModel.destroy({
          where: { workFlowType: { [Op.in]: workflowTypeIds } },
          transaction,
        });
      }

      if (workItemIds.length > 0) {
        await this.taskModel.destroy({
          where: { wid: { [Op.in]: workItemIds } },
          transaction,
        });
        await this.workflowTypeModel.destroy({
          where: { wid: { [Op.in]: workItemIds } },
          transaction,
        });
        await this.workItemRoleModel.destroy({
          where: { wid: { [Op.in]: workItemIds } },
          transaction,
        });
        await this.workItemFieldModel.destroy({
          where: { wid: { [Op.in]: workItemIds } },
          transaction,
        });
      }

      await this.workItemSpaceModel.destroy({
        where: { sid: id },
        transaction,
      });
      await this.workItemModel.destroy({ where: { sid: id }, transaction });
      await this.spaceUserModel.destroy({ where: { sid: id }, transaction });
      await space.destroy({ transaction });
    });
  }

  async findByUserId(userId: number): Promise<Space[]> {
    const spaceUsers = await this.spaceUserModel.findAll({
      where: { uid: userId },
    });
    const spaceIds = spaceUsers.map((su) => su.sid);
    if (spaceIds.length === 0) return [];
    return this.spaceModel.findAll({
      where: { id: spaceIds },
    });
  }

  async join(spaceId: string, userId: number): Promise<void> {
    // 检查空间是否存在
    await this.findOne(spaceId);

    // 检查用户是否已经在空间中
    const existingUser = await this.spaceUserModel.findOne({
      where: { sid: spaceId, uid: userId },
    });

    if (existingUser) {
      // 用户已经在空间中，不需要重复加入
      return;
    }

    // 将用户添加到空间中，默认权限为member
    await this.spaceUserModel.create({
      uid: userId,
      sid: spaceId,
      space_permission: SpacePermission.MEMBER,
    });
  }

  // 检查用户是否是空间管理员
  async checkIsManager(spaceId: string, userId: number): Promise<boolean> {
    const spaceUser = await this.spaceUserModel.findOne({
      where: { sid: spaceId, uid: userId },
    });

    return spaceUser?.space_permission === SpacePermission.MANAGER;
  }

  // 更新空间主页富文本内容
  async updateOverviewContent(
    spaceId: string,
    userId: number,
    dto: UpdateOverviewContentDto,
  ): Promise<Space> {
    // 检查空间是否存在
    const space = await this.findOne(spaceId);

    // 检查权限：只有管理员可以编辑
    const isManager = await this.checkIsManager(spaceId, userId);
    if (!isManager) {
      throw new ForbiddenException('只有空间管理员可以编辑主页内容');
    }

    // 更新内容
    space.overviewContent = dto.overviewContent as Record<string, unknown>;
    await space.save();

    return space;
  }
}
