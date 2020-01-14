import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";

import VueTextareaAutosize from "vue-textarea-autosize";
Vue.use(VueTextareaAutosize);

import firebase from "firebase/app";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYrUXxyqE0l4HAJk5n2I3vicPBdEgIMWk",
  authDomain: "vue-calendar-64902.firebaseapp.com",
  databaseURL: "https://vue-calendar-64902.firebaseio.com",
  projectId: "vue-calendar-64902",
  storageBucket: "vue-calendar-64902.appspot.com",
  messagingSenderId: "790507365213",
  appId: "1:790507365213:web:ed3c083585eaa79937beb4"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
