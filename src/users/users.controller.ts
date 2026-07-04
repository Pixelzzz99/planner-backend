import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  getUser(@Param('id') id: string, @GetUser('userId') userId: string) {
    if (id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
    @GetUser('userId') userId: string,
  ) {
    if (id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.updateUser(id, data);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string, @GetUser('userId') userId: string) {
    if (id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.deleteUser(id);
  }
}
