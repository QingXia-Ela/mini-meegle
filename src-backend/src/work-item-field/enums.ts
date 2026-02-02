export enum FieldType {
  SELECT = 'select',
  MULTI_SELECT = 'multiSelect',
  DATE = 'date',
  DATE_RANGE = 'dateRange',
  TEXT = 'text',
  MEMBER = 'member',
  MULTI_MEMBER = 'multiMember',
  NUMBER = 'number',
  SWITCH = 'switch',
  TEXTAREA = 'textarea',
}

export enum SystemFieldId {
  NAME = 'name',
  DESCRIPTION = 'description',
  CREATED_AT = 'createdAt',
  CREATOR = 'creator',
  IN_PROGRESS_NODE = 'inProgressNode',
  WORKFLOW_TYPE = 'workflowType',
  STATUS = 'status',
  SCHEDULE = 'schedule',
}

export enum RequireFieldId {
  NAME = SystemFieldId.NAME,
  WORKFLOW_TYPE = SystemFieldId.WORKFLOW_TYPE,
}
