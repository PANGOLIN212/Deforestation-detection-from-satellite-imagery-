// *** UNTESTED: written without access to Google Earth Engine. Check every line before relying on it. ***
// Exports two Sentinel-2 L2A median composites (six bands, reflectance 0-1) for an area of interest.
// Run in the Earth Engine Code Editor (code.earthengine.google.com), then download the GeoTIFFs from Google Drive.
// Collection names and band names change over time: confirm them in the Earth Engine data catalog.

// EDIT THIS: an approximate box in the Mau Forest Complex area. Check it on a map and adjust.
var aoi = ee.Geometry.Rectangle([35.5, -0.8, 35.9, -0.4]);
var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'];

function composite(start, end) {
  var col = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoi).filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
    .map(function (img) {
      var scl = img.select('SCL');                       // scene classification: 3 shadow, 8/9 cloud, 10 cirrus
      var clear = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
      return img.updateMask(clear);
    });
  return col.select(bands).median().divide(10000).clip(aoi);
}

// Use the SAME season in both years, to reduce seasonal differences.
var before = composite('2021-01-01', '2021-03-31');
var after  = composite('2023-01-01', '2023-03-31');

Export.image.toDrive({image: before.toFloat(), description: 's2_before', region: aoi, scale: 10, maxPixels: 1e9});
Export.image.toDrive({image: after.toFloat(),  description: 's2_after',  region: aoi, scale: 10, maxPixels: 1e9});
