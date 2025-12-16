import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import Veritas from './src/veritas.js';

describe('Veritas - Всесторонние тесты', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <form id="testForm">
            <div class="form-group">
              <label for="username">Имя пользователя:</label>
              <input type="text" id="username" name="username" required minlength="3" maxlength="20">
              <div class="veritas-error-container"></div>
            </div>
            <div class="form-group">
              <label for="email">Email:</label>
              <input type="email" id="email" name="email" required>
              <div class="veritas-error-container"></div>
            </div>
            <div class="form-group">
              <label for="password">Пароль:</label>
              <input type="password" id="password" name="password" required minlength="6">
              <div class="veritas-error-container"></div>
            </div>
            <div class="form-group">
              <label for="age">Возраст:</label>
              <input type="number" id="age" name="age" min="18" max="100">
              <div class="veritas-error-container"></div>
            </div>
            <div class="form-group checkbox-group">
              <legend>Интересы:</legend>
              <div class="checkbox-options">
                <label><input type="checkbox" name="interests" value="sports"> Спорт</label>
                <label><input type="checkbox" name="interests" value="music"> Музыка</label>
                <label><input type="checkbox" name="interests" value="books"> Книги</label>
                <label><input type="checkbox" name="interests" value="travel"> Путешествия</label>
              </div>
              <div class="veritas-error-container"></div>
            </div>
            <fieldset class="form-group">
              <legend>Способ доставки:</legend>
              <label><input type="radio" name="delivery" value="pickup"> Самовывоз</label>
              <label><input type="radio" name="delivery" value="courier"> Курьер</label>
              <label><input type="radio" name="delivery" value="post"> Почта</label>
              <div class="veritas-error-container" data-group-for="delivery"></div>
            </fieldset>
            <button type="submit">Отправить</button>
          </form>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    globalThis.window = window;
    globalThis.document = document;
    globalThis.HTMLFormElement = window.HTMLFormElement;
    globalThis.HTMLElement = window.HTMLElement;
    globalThis.Event = window.Event;
  });

  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.HTMLFormElement;
    delete globalThis.HTMLElement;
    delete globalThis.Event;
  });

  describe('Тест 1: Happy Path - все данные корректны', () => {
    it('должен успешно валидировать форму с корректными данными', () => {
      const form = document.getElementById('testForm');
      const validator = new Veritas(form, {
        suppressWarnings: true,
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
        { rule: 'min', value: 18, errorMessage: 'Минимальный возраст 18 лет' },
        { rule: 'max', value: 100, errorMessage: 'Максимальный возраст 100 лет' }
      ]);

      validator.addField('interests', [
        { rule: 'minSelected', value: 2, errorMessage: 'Выберите минимум 2 интереса' },
        { rule: 'maxSelected', value: 3, errorMessage: 'Можно выбрать максимум 3 интереса' }
      ]);

      validator.addField('delivery', [
        { rule: 'required', errorMessage: 'Выберите способ доставки' }
      ]);

      document.querySelector('input[name="username"]').value = 'IvanPetrov';
      document.querySelector('input[name="email"]').value = 'ivan@example.com';
      document.querySelector('input[name="password"]').value = 'secure123';
      document.querySelector('input[name="age"]').value = '25';
      
      document.querySelectorAll('input[name="interests"]')[0].checked = true; // sports
      document.querySelectorAll('input[name="interests"]')[1].checked = true; // music
      
      document.querySelectorAll('input[name="delivery"]')[1].checked = true; // courier

      const isValid = validator.validate();
      const errors = validator.getErrors();
      const warnings = validator.getWarnings();

      expect(isValid).toBe(true);
      expect(errors.size).toBe(0);
      expect(warnings.size).toBe(0);
      
      const usernameField = document.querySelector('input[name="username"]');
      expect(usernameField.classList.contains('form-success')).toBe(true);
      expect(usernameField.classList.contains('form-error')).toBe(false);
      
      const errorContainers = document.querySelectorAll('.veritas-error-container');
      errorContainers.forEach(container => {
        expect(container.textContent).toBe('');
      });
    });
  });

  describe('Тест 2: "Злые" тесты - пытаемся сломать валидацию', () => {
    it('должен обрабатывать некорректный HTMLFormElement', () => {
      expect(() => {
        new Veritas(null);
      }).toThrow('Veritas: Первым аргументом должен быть HTMLFormElement');

      expect(() => {
        new Veritas({});
      }).toThrow('Veritas: Первым аргументом должен быть HTMLFormElement');

      expect(() => {
        new Veritas(document.createElement('div'));
      }).toThrow('Veritas: Первым аргументом должен быть HTMLFormElement');
    });

    it('должен выбрасывать ошибку при добавлении несуществующего поля', () => {
      const form = document.getElementById('testForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      expect(() => {
        validator.addField('nonExistentField', [
          { rule: 'required', errorMessage: 'Обязательно' }
        ]);
      }).toThrow('Veritas: Поле с именем "nonExistentField" не найдено в форме');
    });

    it('должен обрабатывать дублирование правил с разными настройками', () => {
      const form = document.getElementById('testForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('username', [
        { rule: 'required', errorMessage: 'Первое сообщение' }
      ]);

      validator.addField('username', [
        { rule: 'required', errorMessage: 'Второе сообщение' },
        { rule: 'minLength', value: 5, errorMessage: 'Теперь минимум 5 символов' }
      ]);

      document.querySelector('input[name="username"]').value = 'ab';

      const result = validator.validateField('username');
      expect(result.isValid).toBe(false);
      expect(result.errorMessages).toContain('Теперь минимум 5 символов');
    });

    it('должен корректно обрабатывать массивные значения для checkbox', () => {
      const form = document.getElementById('testForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('interests', [
        { rule: 'minSelected', value: 2, errorMessage: 'Выберите минимум 2 интереса' }
      ]);

      document.querySelectorAll('input[name="interests"]')[0].checked = true;

      const result = validator.validateField('interests');
      const formIsValid = validator.validate();

      expect(result.isValid).toBe(false);
      expect(result.errorMessages).toContain('Выберите минимум 2 интереса');
      expect(formIsValid).toBe(false);
    });

    it('должен обрабатывать конфликт между HTML атрибутами и JS правилами', () => {
      const form = document.getElementById('testForm');
      
      document.querySelector('input[name="age"]').removeAttribute('required');
      
      const validator = new Veritas(form, { suppressWarnings: false });

      validator.addField('age', [
        { rule: 'required', errorMessage: 'Возраст обязателен' },
        { rule: 'min', value: 16, errorMessage: 'Минимум 16 лет' }
      ]);

      document.querySelector('input[name="age"]').value = '';

      const result = validator.validateField('age');
      const warnings = validator.getWarnings();

      expect(result.isValid).toBe(false);
      expect(result.errorMessages).toContain('Возраст обязателен');
      expect(warnings.has('age')).toBe(true);
    });

    it('должен обрабатывать нестандартные типы полей и значения', () => {
      const form = document.getElementById('testForm');
      
      const weirdField = document.createElement('input');
      weirdField.type = 'text';
      weirdField.name = 'weirdField';
      weirdField.value = '   ';
      form.querySelector('.form-group').appendChild(weirdField);

      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('weirdField', [
        { 
          rule: 'custom', 
          value: (val) => {
            if (!val || val.trim() === '') {
              return 'Поле не может состоять только из пробелов';
            }
            return true;
          }
        }
      ]);

      const result = validator.validateField('weirdField');

      expect(result.isValid).toBe(false);
      expect(result.errorMessages).toContain('Поле не может состоять только из пробелов');
    });

    it('должен корректно работать с live-валидацией при быстром вводе', async () => {
      // Arrange
      const form = document.getElementById('testForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('username', [
        { rule: 'minLength', value: 3, errorMessage: 'Минимум 3 символа' },
        { rule: 'maxLength', value: 5, errorMessage: 'Максимум 5 символов' }
      ]);

      const usernameField = document.querySelector('input[name="username"]');
      
      usernameField.value = 'a';
      usernameField.dispatchEvent(new Event('blur'));
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      usernameField.value = 'ab';
      usernameField.dispatchEvent(new Event('input'));
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      usernameField.value = 'abc';
      usernameField.dispatchEvent(new Event('blur'));
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      usernameField.value = 'abcdef';
      usernameField.dispatchEvent(new Event('blur'));

      const result = validator.validateField('username');
      expect(result.isValid).toBe(false);
      expect(result.errorMessages).toContain('Максимум 5 символов');
    });

    it('должен корректно обрабатывать уничтожение валидатора и повторное использование формы', () => {
      const form = document.getElementById('testForm');
      const validator1 = new Veritas(form, { suppressWarnings: true });

      validator1.addField('username', [
        { rule: 'required', errorMessage: 'Обязательно' }
      ]);

      validator1.destroy();

      const validator2 = new Veritas(form, { suppressWarnings: true });

      validator2.addField('username', [
        { rule: 'required', errorMessage: 'Новое сообщение' }
      ]);

      document.querySelector('input[name="username"]').value = '';

      const result = validator2.validateField('username');

      expect(result.isValid).toBe(false);
      expect(result.errorMessages).toContain('Новое сообщение');
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    });

    it('должен обрабатывать радиокнопки без выбранного значения', () => {
      const form = document.getElementById('testForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('delivery', [
        { rule: 'required', errorMessage: 'Выберите способ доставки' }
      ]);

      const result = validator.validateField('delivery');
      const formIsValid = validator.validate();

      expect(result.isValid).toBe(false);
      expect(result.errorMessages).toContain('Выберите способ доставки');
      expect(formIsValid).toBe(false);
    });

    it('должен корректно применять кастомные сообщения об ошибках', () => {
      // Arrange
      const form = document.getElementById('testForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('email', [
        { rule: 'required', errorMessage: 'Email обязателен' },
        { rule: 'email', errorMessage: 'Введите корректный email' }
      ]);

      validator.setCustomMessage('email', 'email', 'Ой! Похоже, это не email :(');
      
      document.querySelector('input[name="email"]').value = 'not-an-email';
      
      const result = validator.validateField('email');

      expect(result.isValid).toBe(false);
      expect(result.errorMessages).toContain('Ой! Похоже, это не email :(');
      expect(result.errorMessages).not.toContain('Введите корректный email');
    });

    it('должен обрабатывать максимальное количество выбранных checkbox', () => {
      const form = document.getElementById('testForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('interests', [
        { rule: 'minSelected', value: 1, errorMessage: 'Выберите хотя бы 1 интерес' },
        { rule: 'maxSelected', value: 2, errorMessage: 'Не больше 2 интересов!' }
      ]);

      const checkboxes = document.querySelectorAll('input[name="interests"]');
      checkboxes[0].checked = true;
      checkboxes[1].checked = true;
      checkboxes[2].checked = true;

      const result = validator.validateField('interests');

      expect(result.isValid).toBe(false);
      expect(result.errorMessages).toContain('Не больше 2 интересов!');
      expect(result.errorMessages).not.toContain('Выберите хотя бы 1 интерес');
    });
  });

  describe('Тест 3: Граничные случаи и edge cases', () => {
    it('должен корректно обрабатывать пустую форму без полей', () => {
      const emptyFormHTML = `
        <form id="emptyForm">
          <button type="submit">Отправить</button>
        </form>
      `;
      document.body.innerHTML = emptyFormHTML;
      
      const form = document.getElementById('emptyForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      const isValid = validator.validate();
      const errors = validator.getErrors();

      expect(isValid).toBe(true);
      expect(errors.size).toBe(0);
    });

    it('должен обрабатывать поля без контейнеров ошибок', () => {
      const form = document.getElementById('testForm');
      document.querySelectorAll('.veritas-error-container').forEach(el => el.remove());
      
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('username', [
        { rule: 'required', errorMessage: 'Обязательно' }
      ]);

      document.querySelector('input[name="username"]').value = '';

      const result = validator.validateField('username');

      expect(result.isValid).toBe(false);
      const container = document.querySelector('input[name="username"]')
        .nextElementSibling;
      expect(container).toBeTruthy();
      expect(container.className).toContain('veritas-error-container');
    });

    it('должен обрабатывать специальные значения в числовых полях', () => {
      const form = document.getElementById('testForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('age', [
        { rule: 'min', value: 0, errorMessage: 'Возраст не может быть отрицательным' },
        { rule: 'max', value: 150, errorMessage: 'Слишком большой возраст' }
      ]);

      const testCases = [
        { value: '-5', shouldBeValid: false },
        { value: '0', shouldBeValid: true },
        { value: '150', shouldBeValid: true },
        { value: '151', shouldBeValid: false },
        { value: '', shouldBeValid: true },
        { value: 'abc', shouldBeValid: false },
        { value: '12.5', shouldBeValid: true },
        { value: '  25  ', shouldBeValid: true }
      ];

      testCases.forEach((testCase, index) => {
        document.querySelector('input[name="age"]').value = testCase.value;
        const result = validator.validateField('age');
        
        if (testCase.shouldBeValid) {
          expect(result.isValid, `Случай ${index + 1}: "${testCase.value}"`).toBe(true);
        } else {
          expect(result.isValid, `Случай ${index + 1}: "${testCase.value}"`).toBe(false);
        }
      });
    });

    it('должен корректно работать с pattern валидацией', () => {
      const form = document.getElementById('testForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('username', [
        { 
          rule: 'pattern', 
          value: '^[a-zA-Z][a-zA-Z0-9_]{2,19}$', 
          errorMessage: 'Только латинские буквы, цифры и подчеркивание' 
        }
      ]);

      const testCases = [
        { value: 'abc', isValid: true },
        { value: 'a1b2', isValid: true },
        { value: 'user_name', isValid: true },
        { value: '1user', isValid: false },
        { value: 'ab', isValid: false },
        { value: 'user@name', isValid: false },
        { value: 'User-Name', isValid: false },
        { value: 'VeryLongUserNameThatExceeds', isValid: false }
      ];

      testCases.forEach((testCase, index) => {
        document.querySelector('input[name="username"]').value = testCase.value;
        const result = validator.validateField('username');
        
        expect(result.isValid, `Случай ${index + 1}: "${testCase.value}"`)
          .toBe(testCase.isValid);
      });
    });
  });

    describe('Тест 4: AAA — Happy path и проверка submit', () => {
    it('Happy path: submit НЕ предотвращается при валидных данных', () => {
      // Arrange
      document.body.innerHTML = `
        <form id="happyForm">
          <label>Email</label>
          <input name="email">
          <div class="veritas-error-container"></div>
          <button type="submit"></button>
        </form>
      `;
      const form = document.getElementById('happyForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('email', [{ rule: 'required' }]);
      form.querySelector('[name="email"]').value = 'test@test.com';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const prevented = !form.dispatchEvent(submitEvent);

      // Assert
      expect(validator.validate()).toBe(true);
      expect(prevented).toBe(false);
    });
  });

  describe('Тест 5: AAA — злой submit (preventDefault)', () => {
    it('submit предотвращается, если форма невалидна', () => {
      // Arrange
      document.body.innerHTML = `
        <form id="evilForm">
          <label>Email</label>
          <input name="email">
          <div class="veritas-error-container"></div>
          <button type="submit"></button>
        </form>
      `;
      const form = document.getElementById('evilForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('email', [{ rule: 'required' }]);

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const prevented = !form.dispatchEvent(submitEvent);

      // Assert
      expect(validator.validate()).toBe(false);
      expect(prevented).toBe(true);
    });
  });

  describe('Тест 6: AAA — корявая форма без label', () => {
    it('библиотека не падает, даже если label отсутствует', () => {
      // Arrange
      document.body.innerHTML = `
        <form id="badForm">
          <input name="username">
          <div class="veritas-error-container"></div>
        </form>
      `;
      const form = document.getElementById('badForm');

      // Act
      const validator = new Veritas(form, { suppressWarnings: true });
      validator.addField('username', [{ rule: 'required' }]);
      const result = validator.validateField('username');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errorMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Тест 7: AAA — библиотека сама чинит разметку', () => {
    it('создаёт контейнер ошибок, если его нет', () => {
      // Arrange
      document.body.innerHTML = `
        <form id="autoFixForm">
          <label>Login</label>
          <input name="login">
        </form>
      `;
      const form = document.getElementById('autoFixForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('login', [{ rule: 'required' }]);

      // Act
      validator.validateField('login');

      // Assert
      const container = form.querySelector('.veritas-error-container');
      expect(container).toBeTruthy();
    });
  });

  describe('Тест 8: AAA — повторная валидация (идемпотентность)', () => {
    it('validate() можно вызывать много раз без поломки состояния', () => {
      // Arrange
      document.body.innerHTML = `
        <form id="repeatForm">
          <label>Name</label>
          <input name="name">
          <div class="veritas-error-container"></div>
        </form>
      `;
      const form = document.getElementById('repeatForm');
      const validator = new Veritas(form, { suppressWarnings: true });

      validator.addField('name', [{ rule: 'required' }]);

      // Act
      const r1 = validator.validate();
      const r2 = validator.validate();
      const r3 = validator.validate();

      // Assert
      expect(r1).toBe(false);
      expect(r2).toBe(false);
      expect(r3).toBe(false);
    });
  });
});