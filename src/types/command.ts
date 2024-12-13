import { Type as T } from "@sinclair/typebox";
import { StaticDecode } from "@sinclair/typebox";

export const commandSchema = T.Object({
  name: T.Null(),
  parameters: T.Null(),
});

export type Command = StaticDecode<typeof commandSchema>;
