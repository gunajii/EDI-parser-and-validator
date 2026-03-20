export function hasRequiredSegments(required: string[], segmentIds: string[]) {
  return required.filter((seg) => !segmentIds.includes(seg));
}
