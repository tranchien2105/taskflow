import { ConflictException, Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { ILike, Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = this.usersRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      name: createUserDto.name,
    });

    const savedUser = await this.usersRepository.save(user);

    const { password, ...result } = savedUser;

    return result;
  }

  async findAll(search?: string) {
    if (!search?.trim()) {
      return [];
    }

    const keyword = search.trim();

    return this.usersRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
      },
      where: [
        {
          name: ILike(`%${keyword}%`),
        },
        {
          email: ILike(`%${keyword}%`),
        },
      ],
      order: {
        name: 'ASC',
      },
      take: 10,
    });
  }
}
