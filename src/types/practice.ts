import { Prisma } from "@prisma/client";

// Type for Question with ddiOptions and extract relations
export type QuestionWithRelations = Prisma.QuestionGetPayload<{
  include: {
    ddiOptions: true;
    extract: true;
  };
}>;
