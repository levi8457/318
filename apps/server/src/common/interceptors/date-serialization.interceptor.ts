import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * 递归将响应中所有 Date 对象转为 ISO 字符串
 * 解决 TypeORM @CreateDateColumn / @UpdateDateColumn 返回的 Date 对象
 * 被 JSON.stringify 序列化为 {} 的问题
 */
function serializeDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeDates);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeDates(obj[key]);
    }
    return result;
  }
  return obj;
}

@Injectable()
export class DateSerializationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => serializeDates(data)),
    );
  }
}
