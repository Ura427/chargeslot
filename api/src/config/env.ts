import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export class Env {
  @Matches(/^postgres(ql)?:\/\//)
  DATABASE_URL: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsUrl({ require_tld: false, require_protocol: true })
  WEB_ORIGIN: string;

  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @MinLength(32)
  JWT_REFRESH_SECRET: string;
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const env = plainToInstance(Env, raw, { enableImplicitConversion: true });
  const errors = validateSync(env);
  if (errors.length > 0) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join('\n  ');
    throw new Error(`Invalid environment variables:\n  ${details}`);
  }
  return env;
}
