import { Metadata } from "next";

export function packMetadata(metadata: {
    title?: string;
    description?: string;
    [key: string]: unknown;
}): Metadata {
    return {
        ...metadata,
    };
}
