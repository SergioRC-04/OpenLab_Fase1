// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBObuYXwjZQzCzcG_Dn_--BuIq3c3DQL3o",
  authDomain: "openlab-531bd.firebaseapp.com",
  projectId: "openlab-531bd",
  storageBucket: "openlab-531bd.firebasestorage.app",
  messagingSenderId: "878536149711",
  appId: "1:878536149711:web:c525ed9e733a589860c5ba",
  measurementId: "G-S4ZV3S3R7W",
};

// Initialize Firebase
const appFirebase = initializeApp(firebaseConfig);
export default appFirebase;
