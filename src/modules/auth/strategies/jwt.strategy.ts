import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '@prisma/client';

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  user_metadata?: {
    username?: string;
    full_name?: string;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = configService.get<string>('supabase.url');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: SupabaseJwtPayload): Promise<User> {
    const { sub: id, email, user_metadata } = payload;

    if (!id) {
      throw new UnauthorizedException('JWT payload invalid');
    }

    let user = await this.prisma.user.findUnique({
      where: { id },
    });

    // Auto-create user if it doesn't exist
    if (!user) {
      if (!email) {
        throw new UnauthorizedException('Email is required for new users');
      }

      // Generate a username: prefer user_metadata.username, then full_name, then email prefix
      let username = user_metadata?.username;
      if (!username) {
        if (user_metadata?.full_name) {
          username = user_metadata.full_name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
        } else {
          username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        }
      }

      user = await this.prisma.user.create({
        data: {
          id,
          email,
          username,
        },
      });
    }

    return user;
  }
}
