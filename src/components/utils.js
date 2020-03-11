/* global axios, google, Papa, APIKEY, _ */

let geocoder = null

// load google script
var script = document.createElement('script')
script.type = 'text/javascript'
script.src = 'https://maps.googleapis.com/maps/api/js?key=' + APIKEY
script.onload = function () {
  geocoder = new google.maps.Geocoder()
}
document.getElementsByTagName('head')[0].appendChild(script)
// ------------------

function seznamGeoCode (address) {
  return axios.get(`http://api.mapy.cz/geocode?query=${address}`)
    .then(res => {
      const parsed = window.parseXml(res.data)
      const gps = parsed.result.point.item
      if (_.isArray(gps)) throw new Error('found more than 1 result')
      return [parseFloat(gps.y), parseFloat(gps.x)]
    })
}

export function parseCSV (file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      delimiter: ':',
      header: true,
      complete: function (results) {
        const data = results.data.map((i, idx) => {
          return {
            _id: idx,
            point: null,
            properties: i,
            address: i.address
          }
        })
        resolve(data)
      }
    })
  })
}

export function geoCode (address) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      geocoder.geocode({ address }, (results, status) => {
        try {
          if (status === 'OK' && results[0].partial_match) throw new Error()
          const loc = results[0].geometry.location
          resolve([loc.lat(), loc.lng()])
        } catch (err) {
          // try seznam
          seznamGeoCode(address).then(resolve).catch(reject)
        }
      })
    }, 1000)
  })
}

export function toGeoJSON (items) {
  return {
    type: 'FeatureCollection',
    features: items.map(i => {
      return {
        type: 'Feature',
        properties: i.properties,
        geometry: {
          type: 'Point',
          coordinates: [i.point[1], i.point[0]]
        }
      }
    })
  }
}
