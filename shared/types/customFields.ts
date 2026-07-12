// =============================================================================
// Custom Fields — metadata-driven system for user-defined habit log fields
// =============================================================================

export const CUSTOM_FIELD_TYPES = [
  'text',
  'long_text',
  'number',
  'decimal',
  'dropdown',
  'multi_select',
  'checkbox',
  'date',
  'time',
  'rating',
  'url',
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text:         'Text',
  long_text:    'Long Text',
  number:       'Number (integer)',
  decimal:      'Decimal',
  dropdown:     'Dropdown',
  multi_select: 'Multi-Select',
  checkbox:     'Checkbox',
  date:         'Date',
  time:         'Time',
  rating:       'Rating',
  url:          'URL',
};

// Field types that can produce numeric analytics (sum, average, trend)
export const NUMERIC_FIELD_TYPES: CustomFieldType[] = ['number', 'decimal', 'rating'];

export interface CustomFieldValidation {
  min?:       number;
  max?:       number;
  minLength?: number;
  maxLength?: number;
  pattern?:   string;
}

export interface CustomFieldDef {
  id:                  string;
  name:                string;
  type:                CustomFieldType;
  placeholder?:        string;
  required?:           boolean;
  showInHistory?:      boolean;
  includeInAnalytics?: boolean;
  defaultValue?:       string;
  options?:            string[];
  validation?:         CustomFieldValidation;
}

export type CustomFieldValues = Record<string, unknown>;

export interface CustomFieldAggregate {
  fieldId:   string;
  fieldName: string;
  type:      CustomFieldType;
  count:     number;
  total:     number;
  average:   number;
  min:       number;
  max:       number;
  trend:     { date: string; value: number }[];
}
