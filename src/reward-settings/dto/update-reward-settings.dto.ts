import { PartialType } from '@nestjs/mapped-types';

import { CreateRewardSettingsDto } from './create-reward-settings.dto';

export class UpdateRewardSettingsDto extends PartialType(
  CreateRewardSettingsDto,
) {}
