import { SpacePermission } from '../space-user-permission.enum';

export class QuerySpaceUserDto {
  sid: string;
  permission?: SpacePermission;
  offset?: number = 0;
  limit?: number = 20;
}
