export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoicm9oaXQ0Njg1IiwiYSI6ImNsOXRxYXkzdjA0emczcHVrcGtkcGt0bTAifQ._RB2w6sr6cV_32lKy8O1pg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/rohit4685/cl9tr3ipu00cg15mg80gcn9xr',
    scrollZoom: false,
    //   center: [-118.3491, 34.111745],
    //   zoom: 10,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //Create Marker
    const el = document.createElement('div');
    el.className = 'marker';
    //Add Marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    //ADD POPUP

    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p> Day: ${loc.day}:${loc.description}</p>`)
      .addTo(map);
    //extends the map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
