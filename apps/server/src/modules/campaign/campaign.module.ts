import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingCampaign, TargetedOutreach } from './entities/campaign.entity';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MarketingCampaign, TargetedOutreach, CustomerProfile])],
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
