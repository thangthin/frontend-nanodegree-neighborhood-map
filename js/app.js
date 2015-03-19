//Starts of appviewmodel

function AppViewModel() {
    var self = this;
    // AppViewModel
    var initial_places = [
        {name: "Fenway Park",address: "4 Yawkey Way, Boston, MA 02215",type: "landmark"}, 
        {name: "Boston Public Garden",address: "69 Beacon St., Boston, MA 02108",type: "landmark"}, 
        {name: "Boston Public Library",address: "700 Boylston St., At Copley Sq., Boston, MA 02116",type: "landmark"},
        {name: "JFK Library", address: "Columbia Point, Boston, MA 02125", type:"landmark"},
        {name: "Boston Tea Party Ships and Museum", address:"Congress Street Bridge, Boston, MA 02210", type:"landmark"}
    ];

    this.places = ko.observable([]);
    
    initial_places.forEach(function(place) {
        self.places().push(place);
    });
    
    // Sets google map city and properties
    this.city = {latitude: 42.3601,longitude: -71.0589};
    
    // Google map options
    this.mapProp = {
        center: new google.maps.LatLng(self.city.latitude, self.city.longitude),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    // Initialize map with default city marker
    function initialize() {
        self.map = new google.maps.Map(document.getElementById("googleMap"), self.mapProp);
    }

    // Load map on page load
    google.maps.event.addDomListener(window, 'load', initialize);

    //makes marker for every place in places
    self.places().forEach(function(place){
      $.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address="+place.address+"&region=us",{},function(data){
        //parse for place of interest latitude and longitude to set up google map marker
        var dataLat = data.results[0].geometry.location.lat;
        var dataLng = data.results[0].geometry.location.lng;
        var googleMapsLatLng = new google.maps.LatLng(dataLat,dataLng);
        var marker = new google.maps.Marker({
          position: googleMapsLatLng
          // animates marker to draw user attention
          // TODO: hook animation to selected list item
          // animation:google.maps.Animation.BOUNCE
        });
        marker.setMap(self.map);
        // sets marker to listen for click
        // opens InfoWindow when clicked on
        var infowindow = new google.maps.InfoWindow({
          content: "hello"
        });
        // add evet listener for click
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(self.map, marker);
        });

      });
      
    })

//End of AppViewModel
}

ko.applyBindings(new AppViewModel);