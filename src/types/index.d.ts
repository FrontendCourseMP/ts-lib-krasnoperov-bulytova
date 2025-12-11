export interface ValidationRule {
  rule: string;
  value?: unknown;
  errorMessage?: string;
  warning?: boolean;
}

export interface FieldConfig {
  fieldName: string;
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  label?: HTMLLabelElement;
  errorContainer?: HTMLElement;
  rules: ValidationRule[];
  customMessages?: Map<string, string>;
  warnings: string[];
}

export interface VeritasOptions {
  suppressWarnings?: boolean;
  errorClass?: string;
  successClass?: string;
  errorContainerClass?: string;
  errorContainerTag?: string;
  errorContainerPosition?: 'after' | 'before' | 'parent';
}

export interface ValidationResult {
  isValid: boolean;
  errors: Map<string, string[]>;
  warnings: Map<string, string[]>;
  fields: Map<string, FieldValidationResult>;
}

export interface FieldValidationResult {
  isValid: boolean;
  errorMessages: string[];
  warningMessages: string[];
  validity: FieldValidity;
  element: HTMLElement;
}

export interface FieldValidity {
  valid: boolean;
  badInput?: boolean;
  customError?: boolean;
  patternMismatch?: boolean;
  rangeOverflow?: boolean;
  rangeUnderflow?: boolean;
  stepMismatch?: boolean;
  tooLong?: boolean;
  tooShort?: boolean;
  typeMismatch?: boolean;
  valueMissing?: boolean;
  [key: string]: boolean | undefined;
}

declare class Veritas {
  constructor(formElement: HTMLFormElement, options?: VeritasOptions);
  
  addField(fieldName: string, rules: ValidationRule[]): void;
  
  validate(): boolean;
  validateField(fieldName: string): FieldValidationResult;
  
  setCustomMessage(fieldName: string, rule: string, message: string): void;
  
  getErrors(): Map<string, string[]>;
  getWarnings(): Map<string, string[]>;
  
  destroy(): void;
  
  _checkPrerequisites(): boolean;
  _createErrorContainer(field: HTMLElement): HTMLElement;
  _validateFieldWithRules(field: FieldConfig, value: unknown): FieldValidationResult;
  _checkHTMLAttributesVsRules(field: HTMLInputElement, rules: ValidationRule[]): string[];
}

export default Veritas;