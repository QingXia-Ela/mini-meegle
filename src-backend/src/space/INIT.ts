import { CreateWorkItemDto } from '../work-item/dto/create-work-item.dto';
import { CreateWorkItemFieldDto } from '../work-item-field/dto/create-work-item-field.dto';
import { CreateWorkItemRoleDto } from '../work-item-role/dto/create-work-item-role.dto';
import { CreateTaskDto } from '../task/dto/create-task.dto';
import { CreateWorkflowTypeDto } from '../workflow-type/dto/create-workflow-type.dto';
import { FieldType } from '../work-item-field/enums';

export const INIT_USER_STORY_WORK_ITEM_FIELDS: Array<
  Omit<CreateWorkItemFieldDto, 'wid'> & { id: string }
> = [
  {
    id: 'creator',
    name: '创建人',
    type: FieldType.MEMBER,
  },
  {
    id: 'description',
    name: '描述',
    type: FieldType.TEXTAREA,
  },
  {
    id: 'maintainer',
    name: '负责人',
    type: FieldType.MULTI_MEMBER,
  },
  {
    id: 'name',
    name: '名称',
    type: FieldType.TEXT,
  },
  {
    id: 'schedule',
    name: '排期',
    type: FieldType.DATE_RANGE,
  },
  {
    id: 'status',
    name: '状态',
    type: FieldType.SELECT,
    config:
      '{"options":[{"id":"PKRTTJ","label":"未开始","color":"#f5f5f5"},{"id":"lNPsLs","label":"进行中","color":"#e6f7ff"},{"id":"UPoY2h","label":"结束","color":"#f6ffed"}]}',
  },
  {
    id: 'tags',
    name: '标签',
    type: FieldType.MULTI_SELECT,
  },
  {
    id: 'workflowType',
    name: '流程类型',
    type: FieldType.SELECT,
  },
];

export const INIT_BUG_WORK_ITEM_FIELDS = INIT_USER_STORY_WORK_ITEM_FIELDS;
export const INIT_TASK_WORK_ITEM_FIELDS = INIT_USER_STORY_WORK_ITEM_FIELDS;

export const INIT_WORK_ITEMS: Array<Omit<CreateWorkItemDto, 'id' | 'sid'>> = [
  {
    name: '需求',
    icon: 'check-circle-filled',
    color: '#1677ff',
  },
  {
    name: '缺陷',
    icon: 'exclamation-circle',
    color: '#ff4d4f',
  },
  {
    name: '任务',
    icon: 'check-circle-filled',
    color: '#40a9ff',
  },
];

export const INIT_USER_STORY_WORK_ITEM_ROLES: Array<
  Omit<CreateWorkItemRoleDto, 'wid'> & { id: string }
> = [
  { id: 'da', name: 'DA' },
  { id: 'pm', name: 'PM' },
  { id: 'reviewCommittee', name: '需求评审委员会' },
  { id: 'ue', name: 'UE' },
  { id: 'uiux', name: 'UI&UX' },
  { id: 'android', name: 'Android开发' },
  { id: 'fe', name: 'FE开发' },
  { id: 'qa', name: 'QA' },
  { id: 'server', name: 'Server开发' },
  { id: 'uxWriter', name: 'UX Writer' },
  { id: 'ios', name: 'iOS开发' },
  { id: 'techReviewer', name: '技术评审负责人' },
];

export const INIT_BUG_WORK_ITEM_ROLES: Array<
  Omit<CreateWorkItemRoleDto, 'wid'> & { id: string }
> = [
  { id: 'reporter', name: '报告人' },
  { id: 'handler', name: '经办人' },
];

export const INIT_TASK_WORK_ITEM_ROLES: Array<
  Omit<CreateWorkItemRoleDto, 'wid'> & { id: string }
> = [];

export const INIT_USER_STORY_WORKFLOW_TYPES: Array<
  Omit<CreateWorkflowTypeDto, 'wid'>
> = [
  {
    name: '示例流程',
    nodesDataRaw:
      '[{"status":"pending","name":"开始","canUndo":false,"canDelete":false,"prevNodes":[],"nextNodes":["process"],"speicalMark":"startNode","id":"start","visible":true},{"status":"pending","name":"推进中","canUndo":true,"canDelete":true,"prevNodes":["start"],"nextNodes":["end"],"id":"process","visible":true},{"status":"pending","name":"结束","canUndo":true,"canDelete":false,"prevNodes":["process"],"nextNodes":[],"id":"end","visible":true}]',
    eventsDataRaw:
      '{"start":{"onReach":[{"type":"status_transition","to":"PKRTTJ"}],"onComplete":[]},"process":{"onReach":[{"type":"status_transition","to":{"id":"lNPsLs","label":"进行中","color":"#e6f7ff"}}],"onComplete":[]},"end":{"onReach":[{"type":"status_transition","to":{"id":"UPoY2h","label":"结束","color":"#f6ffed"}}],"onComplete":[]}}',
    rolesDataRaw:
      '{"start":[{"id":"pm","name":"PM"}],"process":[{"id":"pm","name":"PM"}],"end":[{"id":"pm","name":"PM"}]}',
  },
  {
    name: '标准业务开发流程',
    nodesDataRaw:
      '[{"status":"in_progress","name":"开始","canUndo":false,"canDelete":false,"prevNodes":[],"nextNodes":["node_rhXsv0"],"speicalMark":"startNode","id":"start","visible":true},{"id":"node_rhXsv0","name":"发起评审","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["start"],"nextNodes":["node_BNQWwh"]},{"id":"node_BNQWwh","name":"产品评审","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_rhXsv0"],"nextNodes":["node_ueqo7Z","node_Kpbfzr","node_5CfR3I","node_2T7ZRO"]},{"id":"node_ueqo7Z","name":"埋点设计","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_BNQWwh"],"nextNodes":["node_xpQQcg"]},{"id":"node_Kpbfzr","name":"AB方案设计","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_BNQWwh"],"nextNodes":["node_xpQQcg"]},{"id":"node_5CfR3I","name":"UE设计","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_BNQWwh"],"nextNodes":["node_S4VTE0"]},{"id":"node_2T7ZRO","name":"翻译文案确认","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_BNQWwh"],"nextNodes":["node_xpQQcg"]},{"id":"node_S4VTE0","name":"UI&UX设计","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_5CfR3I"],"nextNodes":["node_xpQQcg"]},{"id":"node_xpQQcg","name":"技术评审","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_S4VTE0","node_ueqo7Z","node_2T7ZRO","node_Kpbfzr"],"nextNodes":["node_SSoIlj","node_CfAI2v","node_7E6U3v","node_4C2CKQ"]},{"id":"node_SSoIlj","name":"Android估分排期","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_xpQQcg"],"nextNodes":["node_sYG9RP","node_6G9yxV"]},{"id":"node_CfAI2v","name":"Server估分排期","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_xpQQcg"],"nextNodes":["node_mQPQFh","node_6G9yxV"]},{"id":"node_7E6U3v","name":"FE估分排期","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_xpQQcg"],"nextNodes":["node_GwuV98","node_6G9yxV"]},{"id":"node_4C2CKQ","name":"iOS估分排期","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_xpQQcg"],"nextNodes":["node_XwnmCF","node_6G9yxV"]},{"id":"node_sYG9RP","name":"Android开发","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_SSoIlj"],"nextNodes":["node_7I7ATV"]},{"id":"node_mQPQFh","name":"Server开发","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_CfAI2v"],"nextNodes":["node_lByRKs"]},{"id":"node_GwuV98","name":"FE开发","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_7E6U3v"],"nextNodes":["node_xdQZTL"]},{"id":"node_XwnmCF","name":"iOS开发","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_4C2CKQ"],"nextNodes":["node_cEykVx"]},{"id":"node_6G9yxV","name":"QA估分","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_4C2CKQ","node_SSoIlj","node_CfAI2v","node_7E6U3v"],"nextNodes":[]},{"id":"node_7I7ATV","name":"Android测试","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_sYG9RP"],"nextNodes":["node_AtrRnO"]},{"id":"node_lByRKs","name":"Server测试","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_mQPQFh"],"nextNodes":["node_JP6BHq"]},{"id":"node_xdQZTL","name":"FE测试","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_GwuV98"],"nextNodes":["node_FE54rx"]},{"id":"node_cEykVx","name":"iOS测试","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_XwnmCF"],"nextNodes":["node_bBn08k"]},{"id":"node_AtrRnO","name":"Android上线","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_7I7ATV"],"nextNodes":["node_pfXFup"]},{"id":"node_JP6BHq","name":"Server上线","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_lByRKs"],"nextNodes":["node_pfXFup"]},{"id":"node_FE54rx","name":"FE上线","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_xdQZTL"],"nextNodes":["node_pfXFup"]},{"id":"node_bBn08k","name":"iOS上线","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_cEykVx"],"nextNodes":["node_pfXFup"]},{"id":"node_pfXFup","name":"需求效益分析","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_AtrRnO","node_JP6BHq","node_FE54rx","node_bBn08k"],"nextNodes":["node_dgcY25"]},{"id":"node_dgcY25","name":"结束","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_pfXFup"],"nextNodes":[]}]',
    eventsDataRaw: '{}',
    rolesDataRaw:
      '{"start":[{"id":"pm","name":"PM"}],"node_rhXsv0":[{"id":"pm","name":"PM"}],"node_BNQWwh":[{"id":"reviewCommittee","name":"需求评审委员会"}],"node_ueqo7Z":[{"id":"da","name":"DA"}],"node_Kpbfzr":[{"id":"da","name":"DA"}],"node_5CfR3I":[{"id":"ue","name":"UE"}],"node_2T7ZRO":[{"id":"uxWriter","name":"UX Writer"}],"node_S4VTE0":[{"id":"uiux","name":"UI&UX"}],"node_xpQQcg":[{"id":"techReviewer","name":"技术评审负责人"}],"node_SSoIlj":[{"id":"android","name":"Android开发"}],"node_CfAI2v":[{"id":"server","name":"Server开发"}],"node_7E6U3v":[{"id":"fe","name":"FE开发"}],"node_4C2CKQ":[{"id":"ios","name":"iOS开发"}],"node_sYG9RP":[{"id":"android","name":"Android开发"}],"node_mQPQFh":[{"id":"server","name":"Server开发"}],"node_GwuV98":[{"id":"fe","name":"FE开发"}],"node_XwnmCF":[{"id":"ios","name":"iOS开发"}],"node_6G9yxV":[{"id":"qa","name":"QA"}],"node_7I7ATV":[{"id":"qa","name":"QA"}],"node_lByRKs":[{"id":"qa","name":"QA"}],"node_xdQZTL":[{"id":"qa","name":"QA"}],"node_cEykVx":[{"id":"qa","name":"QA"}],"node_AtrRnO":[{"id":"android","name":"Android开发"}],"node_JP6BHq":[{"id":"server","name":"Server开发"}],"node_FE54rx":[{"id":"fe","name":"FE开发"}],"node_bBn08k":[{"id":"ios","name":"iOS开发"}],"node_pfXFup":[{"id":"pm","name":"PM"}],"node_dgcY25":[{"id":"pm","name":"PM"}]}',
  },
];

export const INIT_BUG_WORKFLOW_TYPES: Array<
  Omit<CreateWorkflowTypeDto, 'wid'>
> = [
  {
    name: '缺陷流程',
    nodesDataRaw:
      '[{"status":"in_progress","name":"开始","canUndo":false,"canDelete":false,"prevNodes":[],"nextNodes":["process"],"speicalMark":"startNode","id":"start","visible":true},{"status":"pending","name":"处理中","canUndo":true,"canDelete":true,"prevNodes":["start"],"nextNodes":["node_cpU3Sy"],"id":"process","visible":true},{"id":"node_cpU3Sy","name":"已解决","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["process"],"nextNodes":["node_2qgHTT"]},{"id":"node_2qgHTT","name":"结束","visible":true,"status":"pending","canDelete":true,"canUndo":true,"prevNodes":["node_cpU3Sy"],"nextNodes":[]}]}',
    eventsDataRaw: '{}',
    rolesDataRaw:
      '{"start":[{"id":"reporter","name":"报告人"}],"process":[{"id":"handler","name":"经办人"}],"node_cpU3Sy":[{"id":"handler","name":"经办人"}],"node_2qgHTT":[{"id":"handler","name":"经办人"}]}',
  },
];

export const INIT_TASK_WORKFLOW_TYPES: Array<
  Omit<CreateWorkflowTypeDto, 'wid'>
> = [
  {
    name: '任务流程',
    nodesDataRaw:
      '[{"status":"in_progress","name":"开始","canUndo":false,"canDelete":false,"prevNodes":[],"nextNodes":["process"],"speicalMark":"startNode","id":"start","visible":true},{"status":"pending","name":"推进中","canUndo":true,"canDelete":true,"prevNodes":["start"],"nextNodes":["end"],"id":"process","visible":true},{"status":"pending","name":"结束","canUndo":true,"canDelete":false,"prevNodes":["process"],"nextNodes":[],"id":"end","visible":true}]',
    eventsDataRaw: '{}',
    rolesDataRaw: '{}',
  },
];

export type InitTaskSeed = Omit<CreateTaskDto, 'wid' | 'workflowType'>;

export const INIT_USER_STORY_TASKS: InitTaskSeed[] = [
  {
    fieldStatusList: [
      { fieldId: 'name', value: '新版本功能需求' },
      {
        fieldId: 'description',
        value: '标准业务开发流程的任务。',
      },
      { fieldId: 'status', value: 'PKRTTJ' },
    ],
  },
];

export const INIT_BUG_TASKS: InitTaskSeed[] = [
  {
    fieldStatusList: [
      { fieldId: 'name', value: '缺陷示例：登录后白屏' },
      { fieldId: 'description', value: '复现步骤：登录后进入首页，页面白屏。' },
      { fieldId: 'status', value: 'PKRTTJ' },
      {
        fieldId: 'schedule',
        value: ['2026-02-03T00:00:00.000Z', '2026-02-05T00:00:00.000Z'],
      },
    ],
  },
];

export const INIT_TASK_TASKS: InitTaskSeed[] = [
  {
    fieldStatusList: [
      { fieldId: 'name', value: '任务示例：更新文档' },
      { fieldId: 'description', value: '整理并更新接口文档说明。' },
      { fieldId: 'status', value: 'PKRTTJ' },
      {
        fieldId: 'schedule',
        value: ['2026-02-04T00:00:00.000Z', '2026-02-06T00:00:00.000Z'],
      },
    ],
  },
];

export const INIT_SPACE_MAIN_PAGE_CONTENT = `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"欢迎大家来到本空间! 👋👋 👋 "}]},{"type":"paragraph","content":[{"type":"text","text":"Welcome to this space! 👋👋 👋"}]},{"type":"paragraph","content":[{"type":"text","text":"我们在此进行项目协作，跟进团队的需求、缺陷等事务，共同保证项目的按时交付。"}]},{"type":"paragraph","content":[{"type":"text","text":"We collaborate on the project here, follow up on the team's stories and other issues, and jointly ensure the timely delivery of the project."}]},{"type":"paragraph","content":[{"type":"text","text":"如对流程配置有疑问或需要增删空间成员，可联系下方空间管理员"}]},{"type":"paragraph","content":[{"type":"text","text":"If you have questions about the process configuration or need to add or delete space members, you can contact the space administrator below."}]}]}`;
