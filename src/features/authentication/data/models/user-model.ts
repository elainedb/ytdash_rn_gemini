import { z } from 'zod';
import { User } from '../../domain/entities/user';

export const userModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  photoUrl: z.string().nullable().optional().transform((val) => val ?? null),
});

export type UserModelType = z.infer<typeof userModelSchema>;

export class UserModel implements UserModelType {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly photoUrl: string | null;

  constructor(data: UserModelType) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.photoUrl = data.photoUrl;
  }

  toEntity(): User {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      photoUrl: this.photoUrl,
    };
  }

  static fromGoogleUser(userInfo: any): UserModel {
    const data = {
      id: userInfo.id,
      name: userInfo.name ?? userInfo.givenName ?? '',
      email: userInfo.email,
      photoUrl: userInfo.photo,
    };
    const validatedData = userModelSchema.parse(data);
    return new UserModel(validatedData);
  }
}
