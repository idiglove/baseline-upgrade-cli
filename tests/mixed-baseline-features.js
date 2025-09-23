/**
 * Test file combining good (modern) and bad (legacy) baseline features
 * This file intentionally mixes patterns to test the RAG engine's ability
 * to distinguish between what needs upgrading and what's already modern
 */

// ❌ BAD: Legacy var declarations (should suggest const/let)
var userName = 'John Doe';
var userAge = 25;
var isActive = true;

// ✅ GOOD: Already using modern const/let
const API_BASE_URL = 'https://api.example.com';
let currentUser = null;

// ❌ BAD: XMLHttpRequest (should suggest fetch API)
function fetchUserDataLegacy(userId) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', API_BASE_URL + '/users/' + userId);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var userData = JSON.parse(xhr.responseText);
      console.log('Legacy fetch result:', userData);
    }
  };
  xhr.send();
}

// ✅ GOOD: Already using modern fetch API
async function fetchUserDataModern(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    const userData = await response.json();
    console.log('Modern fetch result:', userData);
    return userData;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// ❌ BAD: Array indexOf for existence checking (should suggest includes)
const fruits = ['apple', 'banana', 'orange'];
if (fruits.indexOf('apple') !== -1) {
  console.log('Found apple using indexOf');
}

var hasOrange = fruits.indexOf('orange') >= 0;

// ✅ GOOD: Already using modern includes
if (fruits.includes('banana')) {
  console.log('Found banana using includes');
}

// ❌ BAD: Object.assign for object merging (should suggest spread syntax)
var defaultSettings = { theme: 'light', fontSize: 14 };
var userSettings = { theme: 'dark' };
var finalSettings = Object.assign({}, defaultSettings, userSettings);

// ✅ GOOD: Already using modern spread syntax
const modernDefaults = { theme: 'light', fontSize: 14 };
const modernUserSettings = { theme: 'dark' };
const modernFinalSettings = { ...modernDefaults, ...modernUserSettings };

// ❌ BAD: Traditional for loop for array transformation (should suggest map)
var numbers = [1, 2, 3, 4, 5];
var doubled = [];
for (var i = 0; i < numbers.length; i++) {
  doubled.push(numbers[i] * 2);
}

// ✅ GOOD: Already using modern map
const modernNumbers = [1, 2, 3, 4, 5];
const modernDoubled = modernNumbers.map(n => n * 2);

// ❌ BAD: Promise constructor with callback pattern (should suggest async/await)
function legacyAsyncOperation() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      var result = { success: true, data: 'Legacy promise result' };
      resolve(result);
    }, 1000);
  });
}

// Mixed: Promise with .then (could suggest async/await)
legacyAsyncOperation()
  .then(function(result) {
    console.log('Promise result:', result);
  })
  .catch(function(error) {
    console.error('Promise error:', error);
  });

// ✅ GOOD: Already using async/await
async function modernAsyncOperation() {
  try {
    const result = await legacyAsyncOperation();
    console.log('Async/await result:', result);
    return result;
  } catch (error) {
    console.error('Async/await error:', error);
  }
}

// ❌ BAD: String concatenation (should suggest template literals)
var welcomeMessage = 'Hello, ' + userName + '! You are ' + userAge + ' years old.';

// ✅ GOOD: Already using template literals
const modernWelcome = `Hello, ${userName}! You are ${userAge} years old.`;

// ❌ BAD: Function expressions that could be arrow functions
var multiplyLegacy = function(a, b) {
  return a * b;
};

var addLegacy = function(a, b) {
  return a + b;
};

// ✅ GOOD: Already using arrow functions
const multiplyModern = (a, b) => a * b;
const addModern = (a, b) => a + b;

// ❌ BAD: Manual property extraction (should suggest destructuring)
function processUser(user) {
  var name = user.name;
  var email = user.email;
  var age = user.age;
  
  console.log('Processing:', name, email, age);
}

// ✅ GOOD: Already using destructuring
function processUserModern(user) {
  const { name, email, age } = user;
  console.log('Processing:', name, email, age);
}

// ❌ BAD: arguments object (should suggest rest parameters)
function legacySum() {
  var total = 0;
  for (var i = 0; i < arguments.length; i++) {
    total += arguments[i];
  }
  return total;
}

// ✅ GOOD: Already using rest parameters
function modernSum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}

// ❌ BAD: Array.prototype.push.apply (should suggest spread syntax)
var arr1 = [1, 2, 3];
var arr2 = [4, 5, 6];
Array.prototype.push.apply(arr1, arr2);

// ✅ GOOD: Already using spread syntax
const modernArr1 = [1, 2, 3];
const modernArr2 = [4, 5, 6];
const combined = [...modernArr1, ...modernArr2];

// ❌ BAD: DOM selection methods (should suggest querySelector)
var elementById = document.getElementById('myElement');
var elementsByClass = document.getElementsByClassName('myClass');
var elementsByTag = document.getElementsByTagName('div');

// ✅ GOOD: Already using modern querySelector
const modernElement = document.querySelector('#myElement');
const modernElements = document.querySelectorAll('.myClass');
const modernDivs = document.querySelectorAll('div');

// ❌ BAD: String methods that have modern alternatives
var text = 'Hello World';
var startsWithHello = text.indexOf('Hello') === 0;
var endsWithWorld = text.indexOf('World') === text.length - 'World'.length;

// ✅ GOOD: Already using modern string methods
const modernText = 'Hello World';
const modernStartsWith = modernText.startsWith('Hello');
const modernEndsWith = modernText.endsWith('World');

// Export for testing
module.exports = {
  userName,
  fetchUserDataLegacy,
  fetchUserDataModern,
  fruits,
  legacyAsyncOperation,
  modernAsyncOperation,
  multiplyLegacy,
  multiplyModern,
  processUser,
  processUserModern,
  legacySum,
  modernSum
};