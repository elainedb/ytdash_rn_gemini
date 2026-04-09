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

export type VideoModel = z.infer<typeof videoModelSchema>;

export const toEntity = (model: VideoModel): Video => {
  return {
    id: model.id,
    title: model.title,
    channelName: model.channelName,
    thumbnailUrl: model.thumbnailUrl,
    publishedAt: new Date(model.publishedAt),
    tags: model.tags,
    city: model.city ?? null,
    country: model.country ?? null,
    latitude: model.latitude ?? null,
    longitude: model.longitude ?? null,
    recordingDate: model.recordingDate ? new Date(model.recordingDate) : null,
  };
};

export const fromEntity = (entity: Video): VideoModel => {
  return {
    id: entity.id,
    title: entity.title,
    channelName: entity.channelName,
    thumbnailUrl: entity.thumbnailUrl,
    publishedAt: entity.publishedAt.toISOString(),
    tags: [...entity.tags],
    city: entity.city,
    country: entity.country,
    latitude: entity.latitude,
    longitude: entity.longitude,
    recordingDate: entity.recordingDate ? entity.recordingDate.toISOString() : null,
  };
};
