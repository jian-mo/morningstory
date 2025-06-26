import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile } from 'passport-github2';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { IntegrationsService } from '../../integrations/integrations.service';
import { IntegrationType } from '@prisma/client';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private usersService: UsersService,
    private integrationsService: IntegrationsService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email', 'repo', 'read:org'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new Error('No email found in GitHub profile');
    }

    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      user = await this.usersService.create({
        email,
        name: profile.displayName || profile.username,
      });
    }

    const existingIntegration = await this.integrationsService.findOne(
      user.id,
      IntegrationType.GITHUB,
    );

    if (existingIntegration) {
      await this.integrationsService.update(user.id, IntegrationType.GITHUB, {
        accessToken,
        refreshToken,
        metadata: {
          githubId: profile.id,
          username: profile.username,
          profileUrl: profile.profileUrl,
        },
        lastSyncedAt: new Date(),
      });
    } else {
      await this.integrationsService.create(user.id, IntegrationType.GITHUB, {
        accessToken,
        refreshToken,
        metadata: {
          githubId: profile.id,
          username: profile.username,
          profileUrl: profile.profileUrl,
        },
      });
    }

    return user;
  }
}