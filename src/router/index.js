import Vue from 'vue'
import Router from 'vue-router'
import * as G6Component from '../components/g6_component/g6_Component.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'G6Component',
      components: G6Component
    }
  ]
})
