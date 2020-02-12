/* global Vue, Vuex, localStorage, axios */

const KEY = '_openurad_user_'
const TOKENKEY = '_openurad_token_'
const savedUser = localStorage.getItem(KEY)
const token = localStorage.getItem(TOKENKEY)

if (token) {
  axios.defaults.headers.common.Authorization = `Bearer ${token}`
}

export default function (router) {
  return new Vuex.Store({
    state: {
      user: savedUser && JSON.parse(savedUser)
    },
    mutations: {
      setToken: (state, token) => {
        localStorage.setItem(TOKENKEY, token)
        axios.defaults.headers.common.Authorization = `Bearer ${token}`
      },
      login: (state, profile) => {
        localStorage.setItem(KEY, JSON.stringify(profile))
        state.user = profile
      }
    },
    actions: {
      toast: function (ctx, opts) {
        Vue.$toast.open(opts)
      }
    }
  })
}
