// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// SUAS CREDENCIAIS DO FIREBASE - NÃO ALTERE, A MENOS QUE SEU PROJETO MUDE
// Certifique-se de que estas são as credenciais do seu projeto Firebase.
// Você pode encontrá-las no console do Firebase > Configurações do Projeto > Seus apps
const firebaseConfig = {
    apiKey: "AIzaSyCNLxSZdgvuODBEZ2h-K6nl3BJqDv98BSA",
    authDomain: "integralog-50702.firebaseapp.com",
    databaseURL: "https://integralog-50702-default-rtdb.firebaseio.com", // VERIFIQUE ESTE URL NO SEU CONSOLE FIREBASE
    projectId: "integralog-50702",
    storageBucket: "integralog-50702.firebase.app",
    messagingSenderId: "943300912697",
    appId: "1:943300912697:web:84d6476431c19281af0fe8",
    measurementId: "G-FZJ1NPMGN4"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exporta as instâncias de Auth e Database para serem usadas em outros scripts
export const auth = getAuth(app);
export const database = getDatabase(app);

// Se você quiser usar esses objetos em outros scripts, você pode armazenar no window
// Isso é útil para scripts que não são módulos ou para depuração no console,
// mas preferimos as importações explícitas acima.
window.firebaseApp = app;
window.firebaseAnalytics = analytics;
window.firebaseAuth = auth;
window.firebaseDB = database;
import { ref, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

window.firebaseRef = ref;
window.firebaseSet = set;
