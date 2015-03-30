$(document).ready(function() {
    // model

    //Starts of appviewmodel
    var AppViewModel = function() {
        // Appview properties 
        var self = this;
        self.places = ko.observableArray([]); // initial list
        self.live_places = ko.observableArray(self.places()); // list for responsive display
        self.showSearch = ko.observable(false); // show search field on view
        self.showList = ko.observable(false);  // show list on view

        // Google Map initialization
        var city = {latitude: 42.3601, longitude: -71.0589};
        // map properties that control Google Map
        self.mapProperties = {
          center: new google.maps.LatLng(city.latitude,city.longitude),
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        function initialize(){
            self.GMap = new google.maps.Map(document.getElementById("googleMap"),self.mapProperties);    
        }
        // Load map on page load
        google.maps.event.addDomListener(window, 'load', initialize());


        // Google Services, initialize initial list and responsive list to first 10 places returned from radius search
        self.service = new google.maps.places.PlacesService(self.GMap);
        self.request = {
          location: self.mapProperties.center,
          radius: 200,
          types: ['food','store']
        };
        // Google Service search 
        self.service.nearbySearch(self.request, callback);
        function callback(results,status){
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            //sets places
            self.places(results.slice(0,10));
            self.live_places(self.places());
            console.log(self.places());
            //sets markers
            for(var i = 0; i < 10; i++){
            // console.log(results[i]);
              setsMarkers(results[i]);
            }
            // console.log(results.length);
          }else{
            console.log("no results matches your search");
          }
        }
        // Make markers for result from google place radius/text search
        function setsMarkers(placeObj){
            var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + placeObj.geometry.location + "&region=us";
            $.getJSON(url,{},function(){
                var marker = new google.maps.Marker({
                    position: placeObj.geometry.location,
                    map: self.GMap
                });
                placeObj.marker = marker;
                var infoWindow = new google.maps.InfoWindow({
                    content: placeObj.name
                });
                placeObj.infoWindow = infoWindow;
                google.maps.event.addListener(marker, 'click', function(){
                    infoWindow.open(self.GMap, marker);
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function(){
                        marker.setAnimation(null)
                    },2000);
                });
            });
        }

        self.animateMarker = function(data){
          // open infowindow
          data.infoWindow.open(self.GMap,data.marker);
          // sets animation for 2 seconds
          data.marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function(){
            data.marker.setAnimation(null);
          },2000);
        }
        // Implement search functionality
        // helper functions
        self.findPlaces = function(searchValue, source, option) {
            var pattern = new RegExp(searchValue, "gi");
            if (option) {
                var result = source().filter(function(place) {
                    return place.name.match(pattern);
                });
            } else {
                var result = source().filter(function(place) {
                    return !(place.name.match(pattern));
                });
            }
            return result;
        }
        // remove markers for each place object
        self.remove_markers = function(places) {
            places.forEach(function(place) {
                place.marker.setMap(null);
            });
        };
        // place markers for each place object
        self.place_markers = function(places) {
            places.forEach(function(place) {
                place.infoWindow.close();
                place.marker.setMap(self.GMap);
            });
        };
        // toggle showSearch value
        self.toggleSearch = function(){
            if (self.showSearch()){
                self.showSearch(false);
                console.log(self.showSearch());
            }else{
                self.showSearch(true);
                console.log(self.showSearch());
            }
        }
        // toggle showList value
        self.toggleList = function(){
            if(self.showList()){
                self.showList(false);
            }else{
                self.showList(true);
            }
        }

        // prevent propagation
        $("input").bind("keypress", function (e) {
          if (e.keyCode == 13) {
            return false;
          }
        });

        var $input = $(".input");
        // Simulate instant search
        // Listen for key input into place search, update list and map as user type
        $input.keyup(function(e) {
          var key = e.which;
          //Check to see if user hit enter
          var searchValue = $input.val(); 
          if(key === 13){
            // do place search
            self.remove_markers(self.places());
            self.remove_markers(self.live_places());
            self.request.query = searchValue;
            self.service.textSearch(self.request, callback);            
          }else{
            //search places array for match
            var results = self.findPlaces(searchValue, self.places, true);
            var removals = self.findPlaces(searchValue, self.places, false);
            self.live_places(results);
            // remove marker of places not in results
            self.remove_markers(removals);
            // place mapper of new search
            self.place_markers(results);
            // TODO: REMOVE ALL CONSOLE.LOG
            console.log("results: ", results);
            console.log("removals: ", removals);
          }
        })
    //End of AppViewModel
    }
    
    ko.applyBindings(new AppViewModel);
//End document load
})
