import { FieldType } from '../enums';

export class UpdateWorkItemFieldDto {
  name?: string;
  type?: FieldType;
  config?: string;
}

