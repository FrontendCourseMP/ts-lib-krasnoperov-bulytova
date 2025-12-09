import Veritas from './src/veritas.js';

const form = document.getElementById('myForm');

const validator = new Veritas(form, {
  suppressWarnings: false,
  errorClass: 'form-error',
  successClass: 'form-success'
});

validator.addField('username', [
  { rule: 'required', errorMessage: 'Имя пользователя обязательно' },
  { rule: 'minLength', value: 3, errorMessage: 'Минимум 3 символа' },
  { rule: 'maxLength', value: 20, errorMessage: 'Максимум 20 символов' }
]);

validator.addField('email', [
  { rule: 'required', errorMessage: 'Email обязателен' },
  { rule: 'email', errorMessage: 'Введите корректный email' }
]);

validator.addField('password', [
  { rule: 'required', errorMessage: 'Пароль обязателен' },
  { rule: 'minLength', value: 6, errorMessage: 'Пароль должен быть минимум 6 символов' }
]);

validator.addField('age', [
  { rule: 'required', errorMessage: 'Возраст обязателен' },
  { rule: 'min', value: 18, errorMessage: 'Минимальный возраст 18 лет' },
  { rule: 'max', value: 100, errorMessage: 'Максимальный возраст 100 лет' }
]);

validator.addField('interests', [
  { rule: 'minSelected', value: 2, errorMessage: 'Выберите минимум 2 интереса' }
]);

validator.addField('interests', [
  { 
    rule: 'minSelected', 
    value: 2, 
    errorMessage: 'Выберите минимум 2 интереса' 
  },
  { 
    rule: 'maxSelected', 
    value: 3, 
    errorMessage: 'Можно выбрать максимум 3 интереса' 
  }
]);

validator.addField('delivery', [
  { 
    rule: 'required', 
    errorMessage: 'Выберите способ доставки' 
  }
]);

validator.setCustomMessage('email', 'email', 'Пожалуйста, введите действительный адрес электронной почты');

form.addEventListener('submit', (e) => {
  if (!validator.validate()) {
    e.preventDefault();
    console.log('Форма содержит ошибки:', validator.getErrors());
    const interestErrors = validator.validateField('interests');
    console.log('Ошибки интересов:', interestErrors.errorMessages);
  }
});



const emailResult = validator.validateField('email');
console.log('Результат валидации email:', emailResult);

const allErrors = validator.getErrors();
console.log('Все ошибки формы:', allErrors);

const allWarnings = validator.getWarnings();
console.log('Все предупреждения:', allWarnings);