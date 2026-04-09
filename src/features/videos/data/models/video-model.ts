import { z } from 'zod';
import { Video } from '../../domain/entities/video';

export const videoModelSchema = z.object({
  id: z.string(),
  title: z.string(),
  channelName: z.string(),
  thumbnailUrl: z.string(),
  publishedAt: z.string(),
  tags: z.array(z.string()),
  city: z.string().nullable(),
  country: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  recordingDate: z.string().nullable(),
});

export type VideoModelType = z.infer<typeof videoModelSchema>;

export class VideoModel implements VideoModelType {
  constructor(
    public id: string,
    public title: string,
    public channelName: string,
    public thumbnailUrl: string,
    public publishedAt: string,
    public tags: string[],
    public city: string | null,
    public country: string | null,
    public latitude: number | null,
    public longitude: number | null,
    public recordingDate: string | null
  ) {}

  toEntity(): Video {
    return {
      id: this.id,
      title: this.title,
      channelName: this.channelName,
      thumbnailUrl: this.thumbnailUrl,
      publishedAt: new Date(this.publishedAt),
      tags: this.tags,
      city: this.city,
      country: this.country,
      latitude: this.latitude,
      longitude: this.longitude,
      recordingDate: this.recordingDate ? new Date(this.recordingDate) : null,
    };
  }
}
