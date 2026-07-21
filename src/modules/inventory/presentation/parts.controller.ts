import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreatePartUseCase } from '../application/use-cases/create-part.use-case'
import { DeletePartUseCase } from '../application/use-cases/delete-part.use-case'
import { GetPartUseCase } from '../application/use-cases/get-part.use-case'
import { GetPartPricesUseCase } from '../application/use-cases/get-part-prices.use-case'
import { ListPartsUseCase } from '../application/use-cases/list-parts.use-case'
import { RestockPartUseCase } from '../application/use-cases/restock-part.use-case'
import { UpdatePartUseCase } from '../application/use-cases/update-part.use-case'
import { InventoryExceptionFilter } from './filters/inventory-exception.filter'
import { CreatePartDto } from './dtos/create-part.dto'
import { ListPartsQuery } from './dtos/list-parts.query'
import { RestockPartDto } from './dtos/restock-part.dto'
import { UpdatePartDto } from './dtos/update-part.dto'

@ApiTags('parts')
@ApiBearerAuth()
@UseFilters(InventoryExceptionFilter)
@Controller('parts')
export class PartsController {
  constructor(
    private readonly createPart: CreatePartUseCase,
    private readonly getPart: GetPartUseCase,
    private readonly getPartPrices: GetPartPricesUseCase,
    private readonly listParts: ListPartsUseCase,
    private readonly updatePart: UpdatePartUseCase,
    private readonly restockPart: RestockPartUseCase,
    private readonly deletePart: DeletePartUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new part in the inventory' })
  create(@Body() dto: CreatePartDto) {
    return this.createPart.execute(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List parts, or return price snapshots when ids is provided' })
  list(@Query() query: ListPartsQuery) {
    if (query.ids !== undefined) {
      const ids = query.ids.split(',').filter((id) => id.length > 0)
      return this.getPartPrices.execute(ids)
    }
    return this.listParts.execute(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a part by id' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.getPart.execute(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a part' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePartDto) {
    return this.updatePart.execute({ id, ...dto })
  }

  @Post(':id/restock')
  @ApiOperation({ summary: 'Add available quantity to a part' })
  restock(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RestockPartDto) {
    return this.restockPart.execute({ id, quantity: dto.quantity })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a part' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deletePart.execute(id)
  }
}
