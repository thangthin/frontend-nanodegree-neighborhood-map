$(document).ready(function() {
    // model
    var GMap = function(data){
        var self = this;
        self.city = data.city;
        self.mapProperties = data.mapProperties;
        self.initialize = function(elem){
            self.map = new google.maps.Map(document.getElementById(elem),self.mapProperties);
        };
    }

    //Starts of appviewmodel
    var AppViewModel = function() {
        var self = this;
        self.places = ko.observableArray([]);
        // for responsive search display
        self.live_places = ko.observableArray(self.places());
        // sets private variable to sets up gmap;
        var city = {latitude: 42.3601, longitude: -71.0589};
        // map properties pass to GMap object
        var mapProperties = {
          center: new google.maps.LatLng(city.latitude,city.longitude),
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        // Sets google map city and properties
        self.GMap = new GMap({
            city: city,
            mapProperties: mapProperties
          });

        // Load map on page load
        google.maps.event.addDomListener(window, 'load', self.GMap.initialize("googleMap"));

        // TODO: GMAP PLACE SEARCHES
        self.service = new google.maps.places.PlacesService(self.GMap.map);
        

        self.request = {
          location: self.GMap.mapProperties.center,
          radius: 200,
          types: ['food','store']
        };
        
        // Google Service search 
        self.service.nearbySearch(self.request, callback);
        self.searchResultEmpty = false;
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
//            console.log(results.length);
          }else{
            console.log("no results matches your search");
            self.searchResultEmpty = true;
            $('.emptySearchResult').show();
          }
        }

        function setsMarkers(placeObj){
            var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + placeObj.geometry.location + "&region=us";
            $.getJSON(url,{},function(){
                var marker = new google.maps.Marker({
                    position: placeObj.geometry.location,
                    map: self.GMap.map
                });
                placeObj.marker = marker;
                var infoWindow = new google.maps.InfoWindow({
                    content: placeObj.name
                });
                placeObj.infoWindow = infoWindow;
                google.maps.event.addListener(marker, 'click', function(){
                    infoWindow.open(self.GMap.map, marker);
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function(){
                        marker.setAnimation(null)
                    },2000);
                });
            });
        }

        self.animateMarker = function(data){
          // open infowindow
          data.infoWindow.open(self.GMap.map,data.marker);
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
        
        self.remove_markers = function(places) {
            places.forEach(function(place) {
                place.marker.setMap(null);
            });
        };
        
        self.place_markers = function(places) {
            places.forEach(function(place) {
                place.infoWindow.close();
                place.marker.setMap(self.GMap.map);
            });
        };

        // prevent propagation
        $("input").bind("keypress", function (e) {
          if (e.keyCode == 13) {
            return false;
          }
        });

        var $input = $("input");

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
