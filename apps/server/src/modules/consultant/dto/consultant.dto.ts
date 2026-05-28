import { IsString, IsNotEmpty, IsOptional, IsArray, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsultantDto {
  @ApiProperty({ example: 'consultant01' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '张三' })
  @IsString()
  @IsNotEmpty()
  realName: string;

  @ApiProperty({ example: '13800138000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'EMP001' })
  @IsOptional()
  @IsString()
  employeeNo?: string;

  @ApiPropertyOptional({ example: ['抗衰', '塑形'] })
  @IsOptional()
  @IsArray()
  speciality?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateConsultantDto {
  @ApiPropertyOptional({ example: '张三' })
  @IsOptional()
  @IsString()
  realName?: string;

  @ApiPropertyOptional({ example: '13800138000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeNo?: string;

  @ApiPropertyOptional({ example: ['抗衰', '塑形', '皮肤'] })
  @IsOptional()
  @IsArray()
  speciality?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
