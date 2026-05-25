import { ApprovalMode } from '../task-nodestatus.model';

export class UpdateApprovalInfoDto {
  mode?: ApprovalMode;
  giteeMrUrl?: string | null;
  documentUrl?: string | null;
  materialUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}
