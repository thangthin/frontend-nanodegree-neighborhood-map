// //Starts of appviewmodel
var AppViewModel = function() {
    "use strict";
    var self = this;
    function initialize(){
        self.city = {lat: 49.24966, lng: -123.11934},
        self.mapProperties = {
                center: new google.maps.LatLng(self.city.lat, self.city.lng),
                zoom:17,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
        self.GMAP = new google.maps.Map(document.getElementById("googleMap"),self.mapProperties);
        self.service = new google.maps.places.PlacesService(self.GMAP);
        self.places = [];
        self.livePlaces = ko.observableArray([]);
        self.currentPlace = ko.observable();
        self.panoramaOptions = {
            position: self.mapProperties.center,
            pov: {
              heading: 34,
              pitch: 10
            }
        };
        self.sv = new google.maps.StreetViewService();
        self.panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'),self.panoramaOptions);
        self.request = {
                location: self.mapProperties.center,
                radius: 200,
                types: ['food','store','establishment'],
                query: "food, store"
            };
        self.GOOGLE_GEOCODE_BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json?address=";
        self.displayError = ko.observable(false);
        self.errorMessage = ko.observable("");
        self.streetViewDisplay = ko.observable(true);
        self.showList = ko.observable(true);
        self.showSearchBar = ko.observable(true);
        getGooglePlaces(self.request);
    }
    //Private functions that gathers places
    //start map with nearby search of places
    function getGooglePlaces(request){
        self.service.nearbySearch(request, showPlacesOnMap); 
    }
    //google search callback, get detail of every request result
    function showPlacesOnMap(results,status){
        if (status == google.maps.places.PlacesServiceStatus.OK){
            self.displayError(false);
            //show Places On map, markers, that have event listener
            results.slice(0).forEach(function(e){
                addMarker(e);
                showMarker(e);
                var formattedContent = infoWindowContent(e);
                addInfoWindow(e,newInfoWindow(formattedContent));
                self.places.push(e);
                self.livePlaces.push(e);
            });
        }else{
           self.displayError(true);
           self.errorMessage("No search result returned");
        }
    }
    //add marker to object and the animation listener
    function addMarker(np){
        var marker = new google.maps.Marker({
            position: np.geometry.location,
            map: self.GMAP
        });
        np.marker = marker;
        google.maps.event.addListener(marker, 'click', function(){
            self.animatePlace(np);
        });
    }
    //add info window for place
    function addInfoWindow(np,newWindow){
        np.infoWindow = newWindow;
    }
    function newInfoWindow(formattedContent){
        var infoWindow = new google.maps.InfoWindow({
            content: formattedContent,
            maxwidth: 350
        });
        return infoWindow;
    }
    //Sets the content of the infowindow for place
    function infoWindowContent(np){
        var content = "<b>"+np.name+"</b><br>";
        if(np.formatted_address || np.vicinity){
            content += (np.vicinity ? np.vicinity : np.formatted_address);
        }
        if(np.opening_hours){
            content += "<br>" + "Open Now: " + np.opening_hours.open_now;
        }
        if(np.rating){
            content += "<br>" + "Rating: " + np.rating;
        }
        if(np.price_level){
            content += "<br>" + "Price Level: " + np.price_level;
        }
        if(np.types){
            content += "<br>" + "Types: " + np.types.join(", ");
        }
        if(np.formatted_phone_number){
            content += "<br>" + "Phone: " + np.formatted_phone_number;
        }
        if(np.photos){
            content += "<br><img src='"+np.photos[0].getUrl({'maxWidth': 250, 'maxHeight': 150})+"' width=250 height=150>"; 
        }
        return content;
    }
    //show marker of place on map
    function showMarker(np){
        np.marker.setMap(self.GMAP);
    }
    //Place ajax request to google service for detail of the googleplace return by nearby search for future addition
    function requestDetail(googlePlace){
        var request = {
            placeId: googlePlace.place_id
        };
        self.service.getDetails(request, manageDetailPlace);
    }

    //Street View callback
    function processSVData(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
            self.displayError(false);

            self.panorama.setPano(data.location.pano);
            self.panorama.setPov({
                heading: 270,
                pitch: 0
            });
            self.panorama.setVisible(true);
        } else {
            // TODO Add better error handling
            if(self.streetViewDisplay()){
                self.displayError(true);
                self.errorMessage("Can't display street view of location"); 
            }
            
        }
    }
    
    //remove marker of every place in array
    function removeMarkers(arr){
        arr.forEach(function(e){
            e.marker.setMap(null);
        });
    }
    //update map markers and list based on user input on new search input field
    function updateSearchResult(searchValue){
        var pattern = new RegExp(searchValue,"gi");
        self.livePlaces(self.places.slice(0));
        self.places.forEach(function(e){
            if(!e.name.match(pattern)){
                e.marker.setMap(null);
                self.livePlaces.remove(e);
            }else{
                e.marker.setMap(self.GMAP);
            }
        });
    }
    //update result based on result from text search (more convenient for users e.g 'burgers in boston' is acceptable)
    function textSearchPlace(request){
        self.service.textSearch(request,showPlacesOnMap);
    }

    //Functions that interact with both view and google search service
    //use text search for user new search for more intuitive searches, e.g 'libraries' would return list of library establishmets. 
    self.textSearchPlaceForButton = function(){
        var query = $('.input').val();
        self.request.query = query;
        textSearchPlace(self.request);
        if(!self.showList()){
            self.showList(true);
        }
    };
    //Event click listener callback
    self.animatePlace = function(place){
        //Update the appropriate observable
        if($(window).width() < 400){
            self.showList(false);
            self.closeInfoWindows();
        }
        self.currentPlace(place); //TODO - take this out, need for debugging only
        self.sv.getPanoramaByLocation(place.geometry.location, 50, processSVData);
        place.infoWindow.open(self.GMAP, place.marker);
        place.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){
            place.marker.setAnimation(null);
        },2000);
        //self.GMAP.setZoom(self.mapProperties.zoom);
        // self.GMAP.panTo(place.geometry.location);
    };
    //update the city, click listener callback
    self.updateCity = function(){
        var $input = $(".city-input");
        var city = $input.val();
        if(city){
            self.displayError(false);
            var url = self.GOOGLE_GEOCODE_BASE_URL + city;
            $.getJSON(url,{},function(data){
                if(data.status === "OK"){
                    self.displayError(false);
                    var new_city = new google.maps.LatLng(data.results[0].geometry.location.lat,
                        data.results[0].geometry.location.lng
                    );
                    removeMarkers(self.livePlaces());
                    self.livePlaces.removeAll();
                    self.places.splice(0);
                    self.mapProperties.center = new_city;
                    self.request.location = new_city;
                    self.GMAP.setCenter(new_city);
                    self.sv.getPanoramaByLocation(new_city, 50, processSVData);
                    textSearchPlace(self.request);
                    if(!self.showList()){
                        self.showList(true);
                    }
                }else{
                    self.displayError(true);
                    self.errorMessage("Can't find new city");
                }
            });
        // Error Handling, if user forget to enter search value;
        }else{
            //Notify user to enter city name in search field
            self.displayError(true);
            self.errorMessage("Enter new city before searching for city");
        }
    };

    self.toggleStreetView = function(){
        if(self.streetViewDisplay()){
            self.streetViewDisplay(false);
        }else{
            self.streetViewDisplay(true);
        }
    };
    self.toggleShowList = function(){
        if(self.showList()){
            self.showList(false);
        }else{
            self.showList(true);
        }   
    };
    self.toggleShowSearchBar = function(){
        if(self.showSearchBar()){
            self.showSearchBar(false);
        }else{
            self.showSearchBar(true);
        }   
    };
    self.closeInfoWindows = function(){
        self.livePlaces().forEach(function(e){
            e.infoWindow.close();
        });
    };
    self.closeMenus = function(){
        self.closeInfoWindows();
        self.showList(false);
        self.showSearchBar(false);
        self.streetViewDisplay(false);
    };

    // Starts running program
    // Load map on page load
    google.maps.event.addDomListener(window, 'load', initialize());
    
    //Adjust initial display if user is using mobile.
    if($(window).width() < 400){
        self.streetViewDisplay(false);
    }
    // Request for google places
    var $input = $(".input");
    // Simulate instant search
    // Listen for key input into place search, update list and map as user type
    $input.keyup(function(e) {
      var key = e.which;
      var searchValue = $input.val();  
      if(key === 13){
        self.request.query = searchValue;
        removeMarkers(self.livePlaces());
        self.livePlaces.removeAll();
        self.places.splice(0);
        textSearchPlace(self.request);
        if(!self.showList()){
            self.showList(true);
        }
      }else{
        updateSearchResult(searchValue);
      }
    });

    // City search
    var $cityInput = $(".city-input");
    $cityInput.keyup(function(e){
        var key = e.which;
        if(key === 13){
            //TODO implement udpateCity
            self.updateCity();
            if(!self.showList()){
                self.showList(true);
            }
        }
    });


// End of AppViewModel
};

ko.applyBindings(new AppViewModel());
