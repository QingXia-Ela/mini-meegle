import { Controller, Get, Req } from '@nestjs/common';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(@Req() req: any) {
    const uid = req.user?.sub;
    if (!uid) return [];
    return this.favoritesService.findAll(Number(uid));
  }
}
