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

import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,

    private readonly activitiesService: ActivitiesService,
  ) { }

  async create(
    projectId: string,
    createDto: CreateLabelDto,
    userId: string,
  ): Promise<Label> {
    const existingLabel =
      await this.labelRepository.findOne({
        where: {
          projectId,
          name: createDto.name,
        },
      });

    if (existingLabel) {
      throw new ConflictException(
        'Label already exists in this project',
      );
    }

    const label = this.labelRepository.create({
      projectId,
      name: createDto.name,
      color: createDto.color,
    });

    const savedLabel =
      await this.labelRepository.save(label);

    // Record activity
    await this.activitiesService.create({
      userId,
      action: 'LABEL_CREATED',
      entity: savedLabel,
      projectId,
      entityType: 'project',
    });

    return savedLabel;
  }

  async findAll(
    projectId: string,
  ): Promise<Label[]> {
    return this.labelRepository.find({
      where: {
        projectId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(
    projectId: string,
    id: string,
  ): Promise<Label> {
    const label =
      await this.labelRepository.findOne({
        where: {
          id,
          projectId,
        },
      });

    if (!label) {
      throw new NotFoundException(
        'Label not found',
      );
    }

    return label;
  }

  async update(
    projectId: string,
    id: string,
    updateDto: UpdateLabelDto,
    userId: string,
  ): Promise<Label> {
    const label =
      await this.findOne(
        projectId,
        id,
      );

    if (updateDto.name !== undefined) {
      const existingLabel =
        await this.labelRepository.findOne({
          where: {
            projectId,
            name: updateDto.name,
          },
        });

      if (
        existingLabel &&
        existingLabel.id !== id
      ) {
        throw new ConflictException(
          'Label already exists in this project',
        );
      }
    }

    Object.assign(
      label,
      updateDto,
    );

    const updatedLabel =
      await this.labelRepository.save(
        label,
      );

    // Record activity
    await this.activitiesService.create({
      userId,
      action: 'LABEL_UPDATED',
      entity: updatedLabel,
      projectId,
      entityType: 'project',
    });

    return updatedLabel;
  }

  async remove(
    projectId: string,
    id: string,
    userId: string,
  ): Promise<void> {
    const label =
      await this.findOne(
        projectId,
        id,
      );

    await this.labelRepository.remove(
      label,
    );

    // Record activity
    await this.activitiesService.create({
      userId,
      action: 'LABEL_DELETED',
      entity: label,
      projectId,
      entityType: 'project',
    });
  }
}