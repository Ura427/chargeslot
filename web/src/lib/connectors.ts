const CONNECTOR_LABELS: Record<string, string> = {
  CCS2: 'CCS2',
  CHADEMO: 'CHAdeMO',
  TYPE2: 'Type 2',
};

export function connectorLabel(type: string): string {
  return CONNECTOR_LABELS[type] ?? type;
}
