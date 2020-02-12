/* global axios, API, Papa, SMap, L, location */

const q = new URLSearchParams(window.location.search)
const layerid = q.get('layerid')

export default {
  data: () => {
    return {
      file: null,
      fields: [
        {
          key: 'title',
          label: 'adresa',
          sortable: true
        },
        {
          key: 'secret',
          label: 'Tajné',
          sortable: false
        }
      ],
      items: [],
      working: false
    }
  },
  methods: {
    submit: function () {
      const data = this.$data
      const map = this.$props.map
      Papa.parse(this.$data.file, {
        delimiter: ':',
        header: true,
        complete: function (results) {
          results.data.map(i => {
            i.point = null
            const p = new SMap.Geocoder(i.title, (res) => {
              const r = res.getResults()
              if (r.length && r[0].results && r[0].results.length) {
                const gps = r[0].results[0].coords
                i.point = {
                  type: 'Point',
                  coordinates: [gps.y, gps.x]
                }
                L.marker([gps.y, gps.x]).addTo(map).bindPopup(i.title)
              }
            })
          })
          data.items = results.data
        }
      })
    },
    save: async function () {
      try {
        this.$data.working = true
        await axios.post(`${API}/objs/${layerid}/batch`, this.$data.items)
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
      <b-button class="mt-3" @click="save">
        Uložit
      </b-button>
    </div>
  </div>
  `
}
