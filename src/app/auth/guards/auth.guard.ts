import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_ROUTE } from "../constants";
import { JwtService } from "src/app/jwt/jwt.service";
import { PayLoadType } from "../types/payload.types";
import { AuthService } from "../auth.service";

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private reflector: Reflector,
        private readonly jwtService: JwtService<PayLoadType>,
        private readonly authService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.get<boolean>(
            IS_PUBLIC_ROUTE,
            context.getHandler(),
        );

        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();

        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Authorization header missing');
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new UnauthorizedException('Invalid authorization format');
        }

        const accessToken = parts[1];

        const payload = await this.jwtService.validateAccessToken(accessToken);

        const user = await this.authService.validateUser(payload.userId);

        request.user = user;

        return true;
    }
}