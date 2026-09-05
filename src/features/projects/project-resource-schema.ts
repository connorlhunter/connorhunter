import { z } from "zod";

export const docsIndexSchema = z.object({
  pages: z.array(
    z.object({
      id: z.string().min(1),
      lastUpdated: z.iso.date(),
      path: z.string().endsWith(".md"),
      section: z.string().min(1),
      sourcePath: z.string().endsWith(".md"),
      title: z.string().min(1),
      version: z.string().min(1),
    }),
  ),
  schemaVersion: z.literal(2),
  title: z.string().min(1),
});

const coverageMetricSchema = z.object({
  covered: z.number().nonnegative(),
  found: z.number().nonnegative(),
});
const coverageFileSchema = z.object({
  branches: coverageMetricSchema.optional(),
  functions: coverageMetricSchema,
  lines: coverageMetricSchema,
  path: z.string().min(1),
});
export const coverageArtifactSchema = z.object({
  minimumCoverage: z.union([z.number(), z.object({ functions: z.number(), lines: z.number() })]),
  schemaVersion: z.literal(2),
  surfaces: z.array(
    z.object({
      files: z.array(coverageFileSchema),
      id: z.string().min(1),
      label: z.string().min(1),
      totals: coverageFileSchema,
    }),
  ),
  updatedAt: z.string().min(1),
});
