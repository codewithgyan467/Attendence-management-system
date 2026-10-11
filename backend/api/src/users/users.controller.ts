import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMyProfile(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.usersService.getMe(userId);
  }

  @Post('me/face-photo')
  async updateMyFacePhoto(@Req() req: any, @Body() body: { base64Image: string }) {
    const userId = req.user.userId || req.user.id;
    return this.usersService.updateFacePhoto(userId, body.base64Image);
  }

  @Roles('ADMIN')
  @Get()
  async getAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Roles('ADMIN')
  @Post('promote-semester')
  async promoteSemester(@Body() body: { mode?: string; fromSemester?: number; toSemester?: number }) {
    return this.usersService.promoteStudents(body);
  }

  @Roles('ADMIN')
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return this.usersService.updateUser(id, data);
  }

  @Roles('ADMIN')
  @Patch(':id')
  async patchUser(@Param('id') id: string, @Body() data: any) {
    return this.usersService.updateUser(id, data);
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
