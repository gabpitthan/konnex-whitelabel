import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Company from "./Company";
import User from "./User";

@Table({ tableName: "DispatchReconciliationAudits" })
class DispatchReconciliationAudit extends Model<DispatchReconciliationAudit> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column
  actorUserId: number;

  @Column
  entityType: string;

  @Column
  entityId: number;

  @Column
  parentId: number;

  @Column
  phase: string;

  @Column
  action: string;

  @Column
  previousStatus: string;

  @Column
  previousStartedAt: Date;

  @Column
  nextStatus: string;

  @Column
  reason: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  actor: User;
}

export default DispatchReconciliationAudit;
