import { z } from "zod";

/**
 * @description Non-empty href used by content links and artifact references.
 */
export const hrefSchema = z.string().min(1);
