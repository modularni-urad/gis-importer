/* global axios, API, Papa, SMap, L, location, alert, */

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
        geometry: i.point
      }
    })
  }
}

export default {
  data: () => {
    return {
      file: null,
      fields: [
        {
          key: 'address',
          label: 'adresa',
          sortable: true
        },
        {
          key: 'properties',
          label: 'Props',
          sortable: false
        }
      ],
      items: [],
      addressLoaded: false,
      failedRows: [],
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
          data.items = results.data.map(i => {
            return {
              properties: i,
              address: i.address
            }
          })
        }
      })
    },
    geoCode: async function () {
      const map = this.$props.map
      const promises = this.$data.items.map(i => {
        i.point = null
        return axios.get(`http://api.mapy.cz/geocode?query=${i.address}`)
          .then(res => {
            const parsed = window.parseXml(res.data)
            const gps = parsed.result.point.item
            i.point = {
              type: 'Point',
              coordinates: [Number(gps.y), Number(gps.x)]
            }
            L.marker([gps.y, gps.x]).addTo(map).bindPopup(i.properties)
          })
          .catch(_ => {
            this.$data.failedRows.push(i)
          })
      })
      await Promise.all(promises)
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
      <b-table small striped hover sort-icon-left no-local-sorting
        id="maps-table"
        primary-key="id"
        :fields="fields"
        :items="items"
      ></b-table>
      <div v-if="failedRows.length > 0">
        <h3>Neúspěšná hledání</h3>
        {{ JSON.stringify(failedRows) }}
      </div>
      <b-button v-if="addressLoaded" class="mt-3" @click="save">
        Uložit
      </b-button>
      <b-button class="mt-3" @click="geoCode">
        Získat adresy
      </b-button>
    </div>
  </div>
  `
}
