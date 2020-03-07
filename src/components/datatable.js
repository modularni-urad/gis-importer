/* global axios, API, Papa, L, location, alert, _, prompt, APIKEY */

const q = new URLSearchParams(window.location.search)
const layerid = q.get('layerid')
if (!layerid) {
  alert('chybí req param layerid. Máte špatný odkaz')
}
function toGeoJSON (items) {
  return {
    type: 'FeatureCollection',
    features: items.map(i => {
      return {
        type: 'Feature',
        properties: i.properties,
        geometry: {
          type: 'Point',
          coordinates: i.point
        }
      }
    })
  }
}

export default {
  data: () => {
    return {
      file: null,
      fields: [
        { key: '_id', label: 'ID' },
        {
          key: 'address',
          label: 'adresa',
          sortable: true
        },
        {
          key: 'properties',
          label: 'Props',
          sortable: false
        },
        { key: 'actions', label: 'Akce' }
      ],
      items: [],
      addressLoaded: false,
      working: false
    }
  },
  methods: {
    submit: function () {
      const data = this.$data
      Papa.parse(this.$data.file, {
        delimiter: ':',
        header: true,
        complete: function (results) {
          data.items = results.data.map((i, idx) => {
            return {
              _id: idx,
              point: null,
              properties: i,
              address: i.address
            }
          })
        }
      })
    },
    editPos: function (item) {
      const map = this.$props.map
      var gps = prompt('zadejte GPS (lat, lng)')
      if (!gps) return
      const parts = gps.split(',')
      item.point = [Number(parts[0]), Number(parts[1])]
      L.marker(item.point).addTo(map).bindPopup(item.properties)
    },
    geoCode: async function () {
      const map = this.$props.map
      const geocoder = new google.maps.Geocoder();
      await this.$data.items.reduce((previousPromise, i) => {
        return i.point !== null ? previousPromise : previousPromise.then(() => {
          return new Promise((resolve, reject) => {
            geocoder.geocode({ address: i.address }, (results, status) => {
              if (status === 'OK' && results[0].partial_match) return resolve()
              const loc = results[0].geometry.location
              i.point = [loc.lat(), loc.lng()]
              L.marker(i.point).addTo(map).bindPopup(i.properties)
              resolve()
            })
          })
        })
      }, Promise.resolve())
      this.$data.addressLoaded = true
    },
    save: async function () {
      try {
        this.$data.working = true
        const data = toGeoJSON(this.$data.items)
        await axios.post(`${API}/objs/${layerid}`, data, {
          withCredentials: true
        })
        this.$store.dispatch('toast', {
          message: 'Uloženo',
          type: 'success'
        })
        this.$data.working = false
        location.reload() // proste to preplachnout :)
      } catch (e) {
        this.$store.dispatch('toast', { message: e, type: 'error' })
        console.log(e)
      } finally {
        this.$data.working = false
      }
    }
  },
  props: ['map'],
  computed: {
    allOk: function () {
      let ok = true
      _.each(this.$data.items, i => {
        if (i.point === null) {
          ok = false
        }
      })
      return ok
    }
  },
  template: `
  <div>
    <div v-if="items.length === 0">
      <b-form-file
        v-model="file"
        :state="Boolean(file)"
        placeholder="Choose a file or drop it here..."
        drop-placeholder="Drop file here..."
        accept="text/csv"
      ></b-form-file>
      <b-button class="mt-3" @click="submit">
        Zpracovat
      </b-button>
    </div>

    <div v-else>
      <b-table small striped small hover sort-icon-left no-local-sorting
        id="maps-table"
        primary-key="id"
        :fields="fields"
        :items="items"
      >
        <template v-slot:cell(actions)="data">
          <i v-if="data.item.point" style="color: green" class="fas fa-check"></i>
          <b-button v-else size="sm" @click="editPos(data.item)">
            edit
          </b-button>
        </template>
      </b-table>
      <b-button v-if="addressLoaded && allOk" class="mt-3" @click="save">
        Uložit
      </b-button>
      <b-button v-if="!addressLoaded" class="mt-3" @click="geoCode">
        Získat adresy
      </b-button>
    </div>
  </div>
  `
}
