$(document).ready(function() {
    // model

    //Starts of appviewmodel
    var AppViewModel = function() {
        // Appview properties 
        var self = this;
        self.places = ko.observableArray([]); // initial list
        self.live_places = ko.observableArray(self.places()); // list for responsive display
        self.toShowSearch = ko.observable(false); // show search field on view
        self.toShowList = ko.observable(false);  // show list on view
        
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
          types: ['food','store'],
          query: "food, store"
        };
        // Google Service search 
        self.service.nearbySearch(self.request, callback);
        function callback(results,status){
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            self.hideSearchErrorMsg();
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
            self.showSearchErrorMsg();
          }
        }
        // Make markers for result from google place radius/text search
        function setsMarkers(placeObj){
            var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + placeObj.geometry.location;
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
                    self.GMap.setZoom(17);
                    self.GMap.panTo(placeObj.geometry.location);
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
        };

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
            if (self.toShowSearch()){
                self.toShowSearch(false);
            }else{
                self.toShowSearch(true);
            }
        };
        self.showList = function(){
            self.toShowList(true);
        };
        self.hideList = function(){
            self.toShowList(false);
        };
        // toggle showList value
        self.toggleList = function(){
            if(self.toShowList()){
                self.toShowList(false);
            }else{
                self.toShowList(true);
            }
        };
        self.newSearch = function(){
            var $input = $(".input");
            var searchValue = $input.val();
            if(searchValue){
                self.remove_markers(self.places());
                self.remove_markers(self.live_places());
                self.request.query = searchValue
                self.service.textSearch(self.request,callback);                
            }else{
                self.showList();
            }
            
        };
        self.searchAndShowList = function(){
            self.newSearch();
            self.showList();
        }
        self.animateMarkerHideList = function(data){
            self.animateMarker(data);
            if(self.toShowList()){
                self.toggleList();
            }
            var new_center = data.geometry.location;
            self.GMap.setZoom(17);
            self.GMap.panTo(new_center);
        };
        self.updateCity = function(){
            var $city_input = $(".city-input");
            var searchValue = $city_input.val();
            if(searchValue){
                var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + searchValue;
                $.getJSON(url,{},function(data){
                    var new_city = new google.maps.LatLng(data.results[0].geometry.location.lat,
                        data.results[0].geometry.location.lng
                    );
                    self.remove_markers(self.places());
                    self.remove_markers(self.live_places());
                    self.mapProperties.center = new_city;
                    self.request.location = new_city;
                    self.GMap.setCenter(new_city);
                    self.service.textSearch(self.request,callback); 
                    self.showList()
                });
            // Error Handling, if user forget to enter search value;
            }else{
                //Notify user to enter city name in search field
                alert("Enter the city you'd like to visit");
            }
        };

        // Error Handling
        self.toShowError = ko.observable(false); // show error msg when true;
        self.showSearchErrorMsg = function(){
            self.toShowError(true);
        };
        self.hideSearchErrorMsg = function(){
            self.toShowError(false);
        };

        // prevent propagation
        $("input").bind("keypress", function (e) {
          if (e.keyCode == 13) {
            return false;
          }
        });
        //New city input field listener
        var $cityInput = $(".city-input");
        $cityInput.keyup(function(e){
            if(e.which === 13){
                self.updateCity();
            }
        });

        var $input = $(".input");
        // Simulate instant search
        // Listen for key input into place search, update list and map as user type
        $input.keyup(function(e) {
          var key = e.which;
          //Check to see if user hit enter
          if(key === 13){
            self.searchAndShowList();
          }else{
            var searchValue = $input.val(); 
            //search places array for match
            var results = self.findPlaces(searchValue, self.places, true);
            var removals = self.findPlaces(searchValue, self.places, false);
            self.live_places(results);
            // remove marker of places not in results
            self.remove_markers(removals);
            // place mapper of new search
            self.place_markers(results);
            if(self.live_places().length > 0){
                self.hideSearchErrorMsg();
            }
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
