import { z } from 'zod';
import { User } from '../../domain/entities/user';
import { User as GoogleUser } from '@react-native-google-signin/google-signin';

export const userModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  photoUrl: z.string().nullable(),
});

export type UserModelType = z.infer<typeof userModelSchema>;

export class UserModel implements UserModelType {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly photoUrl: string | null
  ) {}

  toEntity(): User {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      photoUrl: this.photoUrl,
    };
  }

  static fromGoogleUser(userInfo: any): UserModel {
    const user = userInfo.user || userInfo.data?.user || userInfo;
    return new UserModel(
      user.id,
      user.name || '',
      user.email,
      user.photo || null
    );
  }
}
