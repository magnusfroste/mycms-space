// Configuration utilities

export const getAirtableConfig = () => {
  return {
    apiKey: localStorage.getItem('VITE_AIRTABLE_API_KEY'),
    baseId: localStorage.getItem('VITE_AIRTABLE_BASE_ID'),
    tableId: localStorage.getItem('VITE_AIRTABLE_TABLE_ID'),
    name: localStorage.getItem('VITE_AIRTABLE_NAME'),
  };
};

export const hasAirtableConfig = (): boolean => {
  const { apiKey, baseId } = getAirtableConfig();
  return Boolean(apiKey && baseId);
};

export const setAirtableConfig = (config: {
  apiKey: string;
  baseId: string;
  tableId: string;
  name: string;
}) => {
  // Set in localStorage for use throughout the app
  localStorage.setItem('VITE_AIRTABLE_API_KEY', config.apiKey);
  localStorage.setItem('VITE_AIRTABLE_BASE_ID', config.baseId);
  localStorage.setItem('VITE_AIRTABLE_TABLE_ID', config.tableId);
  localStorage.setItem('VITE_AIRTABLE_NAME', config.name);
  
  // Also store under alternative keys for backward compatibility
  localStorage.setItem('airtableApiKey', config.apiKey);
  localStorage.setItem('airtableBaseId', config.baseId);
  localStorage.setItem('airtableTableId', config.tableId);
  localStorage.setItem('airtableName', config.name);
};
