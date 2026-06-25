import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SupportLinkDocument = SupportLink & Document;

@Schema({ timestamps: true })
export class SupportLink {
  @Prop()
  whatsapp: string;

  @Prop()
  phone: string;

  @Prop()
  facebook: string;

  @Prop()
  instagram: string;

  @Prop()
  messenger: string;
}

export const SupportLinkSchema = SchemaFactory.createForClass(SupportLink);
