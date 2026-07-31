import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class ChangeUsernameDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers and underscores' })
  username: string;
}
