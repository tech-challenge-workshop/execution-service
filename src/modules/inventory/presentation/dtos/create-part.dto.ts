import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreatePartDto {
  @ApiProperty({ example: 'Brake pad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string

  @ApiPropertyOptional({ example: 'Front ceramic brake pad' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @ApiProperty({ example: 5000, description: 'Price in cents (e.g. 5000 = R$ 50.00)' })
  @IsInt()
  @Min(0)
  priceCents!: number

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  initialQuantity!: number
}
