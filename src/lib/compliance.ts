const REQUIRED_EXPORT_DOC_TYPES = ['REGISTRATION', 'INSPECTION'] as const;

type ListingDocumentLike = {
  type: string;
};

export function validateExportReadiness(
  isExportReady: boolean | undefined,
  documents: ListingDocumentLike[] | undefined
) {
  if (!isExportReady) {
    return { valid: true as const };
  }

  const docTypes = new Set((documents || []).map((doc) => doc.type));
  const missing = REQUIRED_EXPORT_DOC_TYPES.filter((docType) => !docTypes.has(docType));

  if (missing.length > 0) {
    return {
      valid: false as const,
      message: `Export-ready listings require documents: ${missing.join(', ')}`,
      missing,
    };
  }

  return { valid: true as const };
}
