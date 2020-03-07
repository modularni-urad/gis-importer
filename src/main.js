/* global Vue, VueToast, L, APIKEY */
import Store from './store.js'
import DataTable from './components/datatable.js'

// load google script
var script = document.createElement('script')
script.type = 'text/javascript'
script.src = 'https://maps.googleapis.com/maps/api/js?key=' + APIKEY
document.getElementsByTagName('head')[0].appendChild(script)
// ------------------

const store = Store()

const query = { val: { lat: 49.414016, lng: 14.658385, z: 13 } }

var map = L.map('map', {
  center: [query.val.lat || 49.414016, query.val.lng || 14.658385],
  editable: true,
  zoom: query.val.z || 16,
  maxZoom: 22
})

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map)

new Vue({
  store,
  data: { map: map },
  template: '<DataTable v-bind:map="map"></DataTable>',
  components: { DataTable }
}).$mount('#app')

Vue.use(VueToast, {
  // One of options
  position: 'top-right'
})
