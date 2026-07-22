import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator'

export class AddDiagnosticDto {
  @ApiProperty({ example: 'Front brake pads worn below 2mm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string

  @ApiPropertyOptional({
    description: 'Free-form diagnostic data (flexible document)',
    example: { severity: 'high', measurements: { padThicknessMm: 1.5 } },
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>
}
