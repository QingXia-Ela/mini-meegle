
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

export const SystemFieldId = {
  NAME: 'name',
  DESCRIPTION: 'description',
  WORKFLOW_TYPE: 'workflowType',
} as const;

export const ReadonlyFieldId = {
  WORKFLOW_TYPE: SystemFieldId.WORKFLOW_TYPE,
} as const;
