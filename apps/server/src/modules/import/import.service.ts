import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { User } from '../auth/entities/user.entity';

export interface ImportResult {
  total: number;
  success: number;
  skipped: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectRepository(CustomerProfile)
    private customerRepo: Repository<CustomerProfile>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * 从 CSV 内容导入客户
   * CSV 格式：name,phone,source,notes,birthday,consultant_name
   */
  async importCustomers(csvContent: string, defaultConsultantId: string): Promise<ImportResult> {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException('CSV 文件为空或格式错误');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const result: ImportResult = {
      total: lines.length - 1,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
        });

        // 验证必填字段
        if (!row.name || !row.phone) {
          result.errors.push(`第 ${i + 1} 行：姓名或手机号为空`);
          result.failed++;
          continue;
        }

        // 检查手机号是否已存在
        const existing = await this.customerRepo.findOne({
          where: { phone: row.phone },
        });
        if (existing) {
          result.skipped++;
          continue;
        }

        // 查找咨询师
        let consultantId = defaultConsultantId;
        if (row.consultant_name) {
          const consultant = await this.userRepo.findOne({
            where: { realName: row.consultant_name, role: 'consultant' },
          });
          if (consultant) {
            consultantId = consultant.id;
          }
        }

        // 创建客户
        await this.customerRepo.save({
          name: row.name,
          phone: row.phone,
          source: row.source || null,
          notes: row.notes || null,
          birthday: row.birthday ? new Date(row.birthday) : null,
          consultantId,
        } as any);

        result.success++;
      } catch (error: any) {
        result.errors.push(`第 ${i + 1} 行：${error.message}`);
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 解析 CSV 行（处理引号内的逗号）
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  }
}
