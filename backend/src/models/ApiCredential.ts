import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Company from "./Company";
import User from "./User";
import Whatsapp from "./Whatsapp";

@Table
class ApiCredential extends Model<ApiCredential> {
  @PrimaryKey @AutoIncrement @Column id: number;
  @ForeignKey(() => Company) @AllowNull(false) @Column companyId: number;
  @BelongsTo(() => Company) company: Company;
  @ForeignKey(() => Whatsapp) @AllowNull(false) @Column whatsappId: number;
  @BelongsTo(() => Whatsapp) whatsapp: Whatsapp;
  @AllowNull(false) @Column(DataType.STRING(16)) prefix: string;
  @AllowNull(false) @Column(DataType.STRING(64)) digest: string;
  @Default("active") @AllowNull(false) @Column(DataType.STRING(16)) status: string;
  @AllowNull @Column(DataType.DATE) expiresAt: Date;
  @AllowNull @Column(DataType.DATE) revokedAt: Date;
  @ForeignKey(() => User) @AllowNull @Column createdBy: number;
  @ForeignKey(() => User) @AllowNull @Column revokedBy: number;
  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}

export default ApiCredential;
