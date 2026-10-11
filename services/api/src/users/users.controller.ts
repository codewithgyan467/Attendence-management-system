import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Roles('ADMIN')
  @Get()
  async getAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Roles('ADMIN')
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Roles('ADMIN')
  @Post()
  async createUser(@Body() data: any) {
    return this.usersService.createUser(data);
  }
}
