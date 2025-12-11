# Veritas – Библиотека валидации форм
Veritas – это JavaScript-библиотека для валидации HTML-форм с поддержкой кастомных правил, живой валидации и обработки ошибок.

#### Архитектура проекта
##### Основные файлы:

1. veritas.js – основной класс библиотеки, содержит всю логику валидации.
2. usage.js – пример использования библиотеки в реальном проекте.
3. index.html – демонстрационная HTML-форма с разными типами полей.
4. styles.css – стили для формы и состояний валидации.

#### Установка

```
import Veritas from './src/veritas.js';
```

#### Примеры реализации
##### index.html

```
<form id="myForm">
  <div class="form-group">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
    <div class="veritas-error-container"></div>
  </div>
  <button type="submit">Отправить</button>
</form>
```

#### Обязательные элементы

1. Форма - обычный HTML <form> элемент.
2. Поля - должны иметь уникальный атрибут name.
3. Контейнеры ошибок - элементы для отображения ошибок.

##### usage.js

```
const form = document.getElementById('myForm');
const validator = new Veritas(form);

validator.addField('email', [
  { rule: 'required', errorMessage: 'Email обязателен' },
  { rule: 'email', errorMessage: 'Введите корректный email' }
]);

form.addEventListener('submit', (e) => {
  if (!validator.validate()) {
    e.preventDefault();
    console.log('Ошибки:', validator.getErrors());
  }
});
```

#### Функционал
##### Поддерживаемые правила валидации
1. required – обязательное поле.
2. email – проверка формата email.
3. minLength / maxLength – минимальная и максимальная длина.
4. min / max – минимальное и максимальное числовое значение.
5. pattern – проверка по регулярному выражению.
6. minSelected / maxSelected – минимальное и максимальное количество выбранных checkbox.
7. custom – пользовательская функция валидации.
8. equals – проверка равенства с другим полем.

#### Особенности
1. Интеграция с HTML5 Constraint Validation API.
2. Автоматическое обнаружение и создание контейнеров для ошибок.
3. Поддержка групп checkbox и radio button.
4. Кастомные сообщения об ошибках.
5. Живая валидация при потере фокуса.
6. Предупреждения о несоответствии HTML-атрибутов и JS-правил.

#### Live-валидация
Включена по умолчанию:
1. При потере фокуса (blur) - валидация поля.
2. При вводе текста (input) - очистка ошибок.

#### Установка и запуск
##### Через npm run dev
1. Открыть консоль в приложении vscode.
2. Оказаться в папке репозитория (если в консоли необходимая папка не открылась автоматически, используйте cd для перемещения).
3. Ввести команду npm run dev.
4. Открыть тестовую страницу с формой по ссылке в консоли или по [этой ссылке](http://localhost:5173/).
##### Через npm vite
Повторите все пункты из первого варианта, но введите другую команду. 

#### API
##### Методы класса Veritas
1. addField(fieldName, rules) – добавление поля для валидации.
2. validateField(fieldName) – валидация конкретного поля.
3. validate() – валидация всех полей формы.
4. getErrors() – получение всех ошибок формы.
5. getWarnings() – получение всех предупреждений.
6. setCustomMessage(fieldName, rule, message) – установка кастомного сообщения.
7. destroy() – очистка всех слушателей и состояний.

##### Опции конструктора
1. suppressWarnings – подавление предупреждений в консоли.
2. errorClass – CSS-класс для невалидных полей.
3. successClass – CSS-класс для валидных полей.
4. errorContainerClass – CSS-класс для контейнера ошибок.
5. errorContainerTag – HTML-тег для контейнера ошибок.
6. errorContainerPosition – расположение контейнера ошибок.

#### Совместимость
Библиотека работает во всех современных браузерах, поддерживающих ES6+ и HTML5 Constraint Validation API.

#### Лицензия
MIT