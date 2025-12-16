class Veritas {
  constructor(formElement, options = {}) {
    if (!(formElement instanceof HTMLFormElement)) {
      throw new Error('Veritas: Первым аргументом должен быть HTMLFormElement');
    }

    this.form = formElement;
    this.fields = new Map();

    this.options = {
      suppressWarnings: false,
      errorClass: 'veritas-error',
      successClass: 'veritas-success',
      errorContainerClass: 'veritas-error-container',
      errorContainerTag: 'div',
      errorContainerPosition: 'after',
      ...options
    };

    this._boundHandleSubmit = this._handleSubmit.bind(this);

    this._init();
  }

  _warn(message) {
    if (this.options?.suppressWarnings) return;
    // eslint-disable-next-line no-console
    console.warn(message);
  }

  _init() {
    if (!this._checkPrerequisites()) {
      this._warn(
        'Veritas: Некоторые поля формы не имеют необходимых элементов (label, контейнер ошибок)'
      );
    }

    this.form.addEventListener('submit', this._boundHandleSubmit);
    this._setupLiveValidation();
  }

  _checkPrerequisites() {
    const fields = this.form.querySelectorAll('input, select, textarea');
    let allValid = true;

    fields.forEach((field) => {
      const hasLabel = Boolean(field.labels && field.labels.length > 0);
      const hasErrorContainer = Boolean(this._findErrorContainer(field));

      if (!hasLabel || !hasErrorContainer) {
        allValid = false;
        this._warn(
          `Veritas: Поле ${field.name} не имеет связанного label или контейнера для ошибок`
        );
      }
    });

    return allValid;
  }

  _findErrorContainer(field) {
    if (field.type === 'checkbox' || field.type === 'radio') {
      const allFields = this.form.querySelectorAll(`input[name="${field.name}"]`);
      if (allFields.length > 1) {
        return this._findGroupErrorContainer(field);
      }
    }

    const errorContainerId = field.dataset.errorContainer;
    if (errorContainerId) {
      return document.getElementById(errorContainerId);
    }

    const nextSibling = field.nextElementSibling;
    if (nextSibling && nextSibling.classList.contains(this.options.errorContainerClass)) {
      return nextSibling;
    }

    const parent = field.parentElement;
    if (parent) {
      const containerInParent = parent.querySelector(`.${this.options.errorContainerClass}`);
      if (containerInParent) return containerInParent;
    }

    return null;
  }

  _findGroupErrorContainer(field) {
    const name = field.name;

    const groupContainerId = field.dataset.groupErrorContainer;
    if (groupContainerId) {
      return document.getElementById(groupContainerId);
    }

    const groupContainer = document.querySelector(
      `.${this.options.errorContainerClass}[data-group-for="${name}"]`
    );
    if (groupContainer) return groupContainer;

    const groupParent = this._findCheckboxGroupParent(field);
    if (groupParent) {
      const containerInGroup = groupParent.querySelector(`.${this.options.errorContainerClass}`);
      if (containerInGroup) return containerInGroup;
    }

    return null;
  }

  _findCheckboxGroupParent(field) {
    let current = field.parentElement;

    while (current && current !== this.form) {
      const checkboxesInCurrent = current.querySelectorAll(`input[name="${field.name}"]`);
      const allCheckboxes = this.form.querySelectorAll(`input[name="${field.name}"]`);

      if (checkboxesInCurrent.length === allCheckboxes.length) {
        return current;
      }

      if (current.tagName === 'FIELDSET' || current.querySelector('legend')) {
        return current;
      }

      current = current.parentElement;
    }

    return this.form;
  }

  _createErrorContainer(field) {
    let container = this._findErrorContainer(field);

    if (!container) {
      container = document.createElement(this.options.errorContainerTag);
      container.className = this.options.errorContainerClass;

      const isGroup =
        (field.type === 'checkbox' || field.type === 'radio') &&
        this.form.querySelectorAll(`input[name="${field.name}"]`).length > 1;

      if (isGroup) {
        const groupParent = this._findCheckboxGroupParent(field);

        container.setAttribute('data-group-for', field.name);

        if (groupParent && groupParent !== this.form) {
          groupParent.appendChild(container);
        } else {
          const allFields = this.form.querySelectorAll(`input[name="${field.name}"]`);
          const lastField = allFields[allFields.length - 1];
          lastField.parentNode.insertBefore(container, lastField.nextSibling);
        }
      } else {
        switch (this.options.errorContainerPosition) {
          case 'before': {
            field.parentNode.insertBefore(container, field);
            break;
          }
          case 'parent': {
            field.parentElement.appendChild(container);
            break;
          }
          case 'after':
          default: {
            field.parentNode.insertBefore(container, field.nextSibling);
            break;
          }
        }
      }
    }

    return container;
  }

  _setupLiveValidation() {
    this.form.addEventListener(
      'blur',
      (e) => {
        const target = e.target;
        if (target && target.matches('input, select, textarea') && this.fields.has(target.name)) {
          this.validateField(target.name);
        }
      },
      true
    );

    this.form.addEventListener(
      'input',
      (e) => {
        const target = e.target;
        if (
          target &&
          target.matches('input[type="text"], input[type="email"], textarea') &&
          this.fields.has(target.name)
        ) {
          this._clearFieldError(target.name);
        }
      },
      true
    );
  }

  _handleSubmit(e) {
    if (!this.validate()) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  _clearFieldError(fieldName) {
    const fieldConfig = this.fields.get(fieldName);
    if (!fieldConfig || !fieldConfig.errorContainer) return;

    fieldConfig.errorContainer.textContent = '';
    fieldConfig.errorContainer.className = this.options.errorContainerClass;

    const allFields = this.form.querySelectorAll(`input[name="${fieldName}"]`);
    allFields.forEach((field) => {
      field.classList.remove(this.options.errorClass);
      field.classList.add(this.options.successClass);
    });
  }

  _showFieldErrors(fieldName, errors) {
    const fieldConfig = this.fields.get(fieldName);
    if (!fieldConfig || !fieldConfig.errorContainer) return;

    fieldConfig.errorContainer.textContent = errors.join(', ');
    fieldConfig.errorContainer.className = `${this.options.errorContainerClass} ${this.options.errorClass}`;

    const allFields = this.form.querySelectorAll(`input[name="${fieldName}"]`);
    allFields.forEach((field) => {
      field.classList.remove(this.options.successClass);
      field.classList.add(this.options.errorClass);
    });
  }

  _showFieldWarnings(fieldName, warnings) {
    if (this.options.suppressWarnings) return;
    if (!warnings || warnings.length === 0) return;

    warnings.forEach((warning) => {
      this._warn(`Veritas: ${fieldName} - ${warning}`);
    });
  }

  addField(fieldName, rules) {
    const fieldElement = this.form.querySelector(`[name="${fieldName}"]`);

    if (!fieldElement) {
      throw new Error(`Veritas: Поле с именем "${fieldName}" не найдено в форме`);
    }

    const warnings = this._checkHTMLAttributesVsRules(fieldElement, rules);

    const label = fieldElement.labels ? fieldElement.labels[0] : null;
    const errorContainer = this._findErrorContainer(fieldElement) || this._createErrorContainer(fieldElement);

    const fieldConfig = {
      element: fieldElement,
      label,
      errorContainer,
      rules,
      customMessages: new Map(),
      warnings
    };

    this.fields.set(fieldName, fieldConfig);

    if (warnings.length > 0) {
      this._showFieldWarnings(fieldName, warnings);
    }
  }

  _checkHTMLAttributesVsRules(field, rules) {
    const warnings = [];
    const rulesMap = new Map(rules.map((rule) => [rule.rule, rule]));

    if (field.required && !rulesMap.has('required')) {
      warnings.push('HTML-атрибут required есть, но нет соответствующего правила в JS');
    }

    if (field.pattern && !rulesMap.has('pattern')) {
      warnings.push('HTML-атрибут pattern есть, но нет соответствующего правила в JS');
    }

    if (field.type === 'number' || field.type === 'range') {
      if (field.min && !rulesMap.has('min')) {
        warnings.push('HTML-атрибут min есть, но нет соответствующего правила min в JS');
      }
      if (field.max && !rulesMap.has('max')) {
        warnings.push('HTML-атрибут max есть, но нет соответствующего правила max в JS');
      }
    }

    if (field.minLength > 0 && !rulesMap.has('minLength')) {
      warnings.push('HTML-атрибут minlength есть, но нет соответствующего правила minLength в JS');
    }

    if (field.maxLength > 0 && !rulesMap.has('maxLength')) {
      warnings.push('HTML-атрибут maxlength есть, но нет соответствующего правила maxLength в JS');
    }

    return warnings;
  }

  _validateFieldWithRules(fieldConfig, value) {
    const result = {
      isValid: true,
      errorMessages: [],
      warningMessages: [],
      validity: { valid: true },
      element: fieldConfig.element
    };

    const field = fieldConfig.element;

    if (!field.validity.valid) {
      result.isValid = false;
      result.validity.valid = false;

      const validity = field.validity;
      const errorMessages = [];

      if (validity.valueMissing) {
        result.validity.valueMissing = true;
        errorMessages.push(this._getErrorMessage(fieldConfig, 'required', 'Это поле обязательно для заполнения'));
      }
      if (validity.typeMismatch) {
        result.validity.typeMismatch = true;
        errorMessages.push(this._getErrorMessage(fieldConfig, 'email', 'Введите корректный email'));
      }
      if (validity.patternMismatch) {
        result.validity.patternMismatch = true;
        errorMessages.push(this._getErrorMessage(fieldConfig, 'pattern', 'Значение не соответствует формату'));
      }
      if (validity.tooShort) {
        result.validity.tooShort = true;
        errorMessages.push(
          this._getErrorMessage(fieldConfig, 'minLength', `Минимальная длина: ${field.minLength}`)
        );
      }
      if (validity.tooLong) {
        result.validity.tooLong = true;
        errorMessages.push(
          this._getErrorMessage(fieldConfig, 'maxLength', `Максимальная длина: ${field.maxLength}`)
        );
      }
      if (validity.rangeUnderflow) {
        result.validity.rangeUnderflow = true;
        errorMessages.push(this._getErrorMessage(fieldConfig, 'min', `Минимальное значение: ${field.min}`));
      }
      if (validity.rangeOverflow) {
        result.validity.rangeOverflow = true;
        errorMessages.push(this._getErrorMessage(fieldConfig, 'max', `Максимальное значение: ${field.max}`));
      }
      if (validity.stepMismatch) {
        result.validity.stepMismatch = true;
        errorMessages.push(this._getErrorMessage(fieldConfig, 'step', `Значение должно быть кратно ${field.step}`));
      }

      result.errorMessages = errorMessages;
    }

    for (const rule of fieldConfig.rules) {
      const ruleResult = this._applyRule(rule, value, field);

      if (!ruleResult.isValid) {
        result.isValid = false;
        result.validity.valid = false;
        result.validity[rule.rule] = true;

        const errorMessage =
          ruleResult.errorMessage ||
          this._getErrorMessage(fieldConfig, rule.rule, `Ошибка в правиле: ${rule.rule}`);

        result.errorMessages.push(errorMessage);
      }

      if (ruleResult.warning) {
        result.warningMessages.push(ruleResult.warning);
      }
    }

    return result;
  }

  _applyRule(rule, value, field) {
    const result = { isValid: true };

    switch (rule.rule) {
      case 'required': {
        if (field.type === 'checkbox') {
          result.isValid = field.checked;
        } else if (field.type === 'radio') {
          const radioGroup = this.form.querySelectorAll(`input[name="${field.name}"]`);
          result.isValid = Array.from(radioGroup).some((radio) => radio.checked);
        } else {
          result.isValid = value !== '' && value !== null && value !== undefined;
        }
        break;
      }

      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        result.isValid = emailRegex.test(value);
        break;
      }

      case 'minLength': {
        result.isValid = String(value).length >= rule.value;
        break;
      }

      case 'maxLength': {
        result.isValid = String(value).length <= rule.value;
        break;
      }

      case 'min': {
        result.isValid = Number(value) >= rule.value;
        break;
      }

      case 'max': {
        result.isValid = Number(value) <= rule.value;
        break;
      }

      case 'pattern': {
        const regex = new RegExp(rule.value);
        result.isValid = regex.test(value);
        break;
      }

      case 'equals': {
        const otherField = this.form.querySelector(`[name="${rule.value}"]`);
        result.isValid = Boolean(otherField && value === otherField.value);
        break;
      }

      case 'custom': {
        if (typeof rule.value === 'function') {
          const customResult = rule.value(value, field);
          result.isValid = customResult === true || customResult === undefined;

          if (typeof customResult === 'string') {
            result.errorMessage = customResult;
          }
        }
        break;
      }

      case 'minSelected': {
        if (field.type === 'checkbox') {
          const checkboxes = this.form.querySelectorAll(`input[name="${field.name}"]`);
          const checkedCount = Array.from(checkboxes).filter((cb) => cb.checked).length;
          result.isValid = checkedCount >= rule.value;
        }
        break;
      }

      case 'maxSelected': {
        if (field.type === 'checkbox') {
          const checkboxes = this.form.querySelectorAll(`input[name="${field.name}"]`);
          const checkedCount = Array.from(checkboxes).filter((cb) => cb.checked).length;
          result.isValid = checkedCount <= rule.value;
        }
        break;
      }

      default: {
        break;
      }
    }

    if (!result.isValid && rule.errorMessage) {
      result.errorMessage = rule.errorMessage;
    }

    if (rule.warning) {
      result.warning = rule.warning;
    }

    return result;
  }

  _getErrorMessage(fieldConfig, ruleName, defaultMessage) {
    return fieldConfig.customMessages.get(ruleName) || defaultMessage;
  }

  setCustomMessage(fieldName, rule, message) {
    const fieldConfig = this.fields.get(fieldName);
    if (fieldConfig) {
      fieldConfig.customMessages.set(rule, message);
    }
  }

  validateField(fieldName) {
    const fieldConfig = this.fields.get(fieldName);
    if (!fieldConfig) {
      throw new Error(`Veritas: Поле "${fieldName}" не зарегистрировано для валидации`);
    }

    const field = fieldConfig.element;
    let value;

    if (field.type === 'checkbox' || field.type === 'radio') {
      const allFields = this.form.querySelectorAll(`input[name="${field.name}"]`);

      if (allFields.length === 1 && field.type === 'checkbox') {
        value = field.checked ? field.value : '';
      } else {
        value = Array.from(allFields)
          .filter((item) => item.checked)
          .map((item) => item.value);
      }
    } else {
      value = field.value;
    }

    const result = this._validateFieldWithRules(fieldConfig, value);

    this._clearFieldError(fieldName);

    if (!result.isValid && result.errorMessages.length > 0) {
      this._showFieldErrors(fieldName, result.errorMessages);
    } else {
      const allFields = this.form.querySelectorAll(`input[name="${fieldName}"]`);
      allFields.forEach((fieldElement) => {
        fieldElement.classList.remove(this.options.errorClass);
        fieldElement.classList.add(this.options.successClass);
      });
    }

    if (result.warningMessages.length > 0) {
      this._showFieldWarnings(fieldName, result.warningMessages);
    }

    return result;
  }

  validate() {
    let formIsValid = true;

    for (const [fieldName] of this.fields) {
      const result = this.validateField(fieldName);
      if (!result.isValid) formIsValid = false;
    }

    return formIsValid;
  }

  getErrors() {
    const errors = new Map();

    for (const [fieldName] of this.fields) {
      const result = this.validateField(fieldName);
      if (!result.isValid) errors.set(fieldName, result.errorMessages);
    }

    return errors;
  }

  getWarnings() {
    const warnings = new Map();

    for (const [fieldName, fieldConfig] of this.fields) {
      if (fieldConfig.warnings.length > 0) {
        warnings.set(fieldName, fieldConfig.warnings);
      }
    }

    return warnings;
  }

  destroy() {
    if (this.form && this._boundHandleSubmit) {
      this.form.removeEventListener('submit', this._boundHandleSubmit);
    }

    for (const [fieldName, fieldConfig] of this.fields) {
      if (fieldConfig.errorContainer) {
        fieldConfig.errorContainer.textContent = '';
        fieldConfig.errorContainer.className = this.options.errorContainerClass;
      }
      fieldConfig.element.classList.remove(this.options.errorClass, this.options.successClass);

      // fieldName тут используется для совместимости с Map-итерацией и читабельности
      void fieldName;
    }

    this.fields.clear();

    this.form = null;
    this.options = null;
    this._boundHandleSubmit = null;
  }
}

export default Veritas;
