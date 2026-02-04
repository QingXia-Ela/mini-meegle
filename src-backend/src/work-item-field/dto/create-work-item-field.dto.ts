import { FieldType } from '../enums';

export class CreateWorkItemFieldDto {
  wid: string;
  name: string;
  type: FieldType;
  config?: string;
}
