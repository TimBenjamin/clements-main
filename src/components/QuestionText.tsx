"use client";

interface QuestionTextProps {
  text: string;
  inlineImages?: Map<string, string>; // filename -> S3 URL
}

export function QuestionText({ text }: QuestionTextProps) {
  // Replace [[inline-img: filename]] with actual image tags
  let processedText = text;

  // Find all inline image references
  const inlineImgRegex = /\[\[inline-img:\s*([^\]]+)\]\]/g;
  const matches = Array.from(text.matchAll(inlineImgRegex));

  // Replace each match with an img tag
  for (const match of matches) {
    const filename = match[1].trim();
    const s3Url = `https://clementstheory.s3.eu-west-1.amazonaws.com/images/inline/${filename}`;
    const imgTag = `<img src="${s3Url}" alt="${filename}" style="display: inline-block; max-height: 2em; vertical-align: middle; margin: 0 0.25em;" />`;
    processedText = processedText.replace(match[0], imgTag);
  }

  // Find all extract references (block-level)
  const extractRegex = /\[\[extract:\s*([^\]]+)\]\]/g;
  const extractMatches = Array.from(text.matchAll(extractRegex));

  // Replace each extract with a block-level image
  for (const match of extractMatches) {
    const filename = match[1].trim();
    const s3Url = `https://clementstheory.s3.eu-west-1.amazonaws.com/images/extracts/${filename}`;
    const imgTag = `<div style="margin: 1rem 0; text-align: center;"><img src="${s3Url}" alt="${filename}" style="max-width: 100%; height: auto;" /></div>`;
    processedText = processedText.replace(match[0], imgTag);
  }

  return (
    <div
      style={{ fontSize: "1.1rem", fontWeight: 500 }}
      dangerouslySetInnerHTML={{ __html: processedText }}
    />
  );
}
