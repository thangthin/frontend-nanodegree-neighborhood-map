var city = {latitude: 42.3601, longitude: -71.0589};
// Google map options
var mapProp = {
    center: new google.maps.LatLng(city.latitude,city.longitude), 
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP 
  }; 

// Initialize map with default city marker
function initialize() {
  var map = new google.maps.Map(document.getElementById("googleMap"),mapProp);

  var marker = new google.maps.Marker({
    position: mapProp.center,
    // animates marker to draw user attention
    // TODO: hook animation to selected list item
    // animation:google.maps.Animation.BOUNCE
    });

  marker.setMap(map);

  // sets marker to listen for click
  // opens InfoWindow when clicked on
  var infowindow = new google.maps.InfoWindow({
    content: "hello"
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.open(map,marker);
  });

//End of initialize
}

// Load map on page load
google.maps.event.addDomListener(window, 'load', initialize);

function AppViewModel(){
  this.places = ko.observable(
    ["test","vancouver","seattle",
      "portland","montreal","toronto",
      "san francisco"
    ]);

}

ko.applyBindings(new AppViewModel);



