import { z } from "zod";

/**
 * @description Non-empty href used by content links and artifact references.
 */
export const hrefSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      !/[\u0000-\u001f\u007f]/u.test(value) &&
      !value.startsWith("//") &&
      (/^(?:https?:|mailto:|tel:|site:\/\/|artifact:\/\/|asset:\/\/)/iu.test(value) ||
        /^(?:\/|#|\?|\.\.?\/)/u.test(value)),
    { message: "Unsupported or unsafe href." },
  );
