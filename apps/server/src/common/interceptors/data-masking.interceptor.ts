import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from '../utils/encryption.util';

interface SensitiveFieldConfig {
  field: string;
  type: 'phone' | 'idCard' | 'name';
}

const SENSITIVE_FIELDS: SensitiveFieldConfig[] = [
  { field: 'phone', type: 'phone' },
  { field: 'idCard', type: 'idCard' },
  { field: 'realName', type: 'name' },
];

@Injectable()
export class DataMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userRole = request.user?.role;

    // 管理员不脱敏，直接返回原始数据
    if (userRole === 'admin') {
      return next.handle();
    }

    // 咨询师脱敏
    return next.handle().pipe(
      map(data => this.maskSensitiveData(data)),
    );
  }

  private maskSensitiveData(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }

    if (typeof data === 'object') {
      const masked = { ...data };
      for (const config of SENSITIVE_FIELDS) {
        if (masked[config.field] && typeof masked[config.field] === 'string') {
          switch (config.type) {
            case 'phone':
              masked[config.field] = EncryptionService.maskPhone(masked[config.field]);
              break;
            case 'idCard':
              masked[config.field] = EncryptionService.maskIdCard(masked[config.field]);
              break;
            case 'name':
              masked[config.field] = EncryptionService.maskName(masked[config.field]);
              break;
          }
        }
      }

      for (const key in masked) {
        if (typeof masked[key] === 'object' && masked[key] !== null) {
          masked[key] = this.maskSensitiveData(masked[key]);
        }
      }

      return masked;
    }

    return data;
  }
}
