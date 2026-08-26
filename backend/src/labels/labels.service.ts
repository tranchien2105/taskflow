import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Label } from './entities/label.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
  ) {}

  async create(projectId: string, createDto: CreateLabelDto): Promise<Label> {
    const existingLabel = await this.labelRepository.findOne({
      where: {
        projectId,
        name: createDto.name,
      },
    });

    if (existingLabel) {
      throw new ConflictException('Label already exists in this project');
    }

    const label = this.labelRepository.create({
      projectId,
      name: createDto.name,
      color: createDto.color,
    });

    return this.labelRepository.save(label);
  }

  async findAll(projectId: string): Promise<Label[]> {
    return this.labelRepository.find({
      where: {
        projectId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(projectId: string, id: string): Promise<Label> {
    const label = await this.labelRepository.findOne({
      where: {
        id,
        projectId,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    return label;
  }

  async update(
    projectId: string,
    id: string,
    updateDto: UpdateLabelDto,
  ): Promise<Label> {
    const label = await this.findOne(projectId, id);

    if (updateDto.name !== undefined) {
      const existingLabel = await this.labelRepository.findOne({
        where: {
          projectId,
          name: updateDto.name,
        },
      });

      if (existingLabel && existingLabel.id !== id) {
        throw new ConflictException('Label already exists in this project');
      }
    }

    Object.assign(label, updateDto);

    return this.labelRepository.save(label);
  }

  async remove(projectId: string, id: string): Promise<void> {
    const label = await this.findOne(projectId, id);

    await this.labelRepository.remove(label);
  }
}
