Vue.component("profile-about", {
  template: "#profile-about",
});
Vue.component("profile-posts", {
  template: "#profile-posts",
});
Vue.component("profile-contact", {
  template: "#profile-contact",
});
const profile = new Vue({
  el: "#profile",
  data: {
    view: "profile-about",
    active: "about",
    name: "Mark Rigby",
  },
});
