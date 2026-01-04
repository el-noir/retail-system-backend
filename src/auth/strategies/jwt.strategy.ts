import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserService } from "src/user/user.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        private configService: ConfigService,
        private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-this-in-production',
    });
  }  

    async validate(payload: any){
        // For temporary registration tokens, return the payload directly
        if (payload.isRegistrationPending) {
            return payload;
        }
        
        // For regular authentication tokens, fetch the user from database
        if (!payload.sub) {
            throw new UnauthorizedException('Invalid token payload');
        }
        
        const user = await this.userService.getUserById(payload.sub);

        if(!user){
            throw new UnauthorizedException();
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        }
    }
}