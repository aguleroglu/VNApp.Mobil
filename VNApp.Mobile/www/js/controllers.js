var VNApp = angular.module('VNApp', ['ionic','ngCordova'])
.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        if (cordova.platformId === "ios" && window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

            cordova.plugins.Keyboard.disableScroll(true);
        }
        if(window.StatusBar) {
            StatusBar.styleDefault();
        }


    });
})

VNApp.controller('VoiceController', ['$scope', '$ionicPlatform', '$http', function ($scope, $ionicPlatform, $http) {

    $ionicPlatform.ready(function () {
        window.plugins.speechRecognition.requestPermission(
            function successCallback() {
                //speeachAvaible = true;
            }, function errorCallback() {
                //speeachAvaible = false;
            }
        );
    });

    $scope.recognize = function () {
        let options = {
            language: "tr-TR",
            matches: 1,
            prompt: "Sizi dinliyorum :)",
            showPopup: true,
            showPartial: true
        }

        window.plugins.speechRecognition.startListening(
            function successCallback(items) {
                $scope.recognized = "";
                var txt = items[0];
                console.log(txt);
                $http.get('http://vnapp.herokuapp.com/api/speech?q=' + txt).then(function (response) {

                    var res = response.data;

                    if (res.Category == null) {
                        $scope.speak(res.Count + ' tane haber okuyorum.', null, null);
                    }
                    else {
                        $scope.speak(res.Count + ' tane ' + res.Category + ' haberi okuyorum.', null, null);
                    }
                    console.log(JSON.stringify(res));

                    if (res.Intent != "read") {
                        $scope.speak("Ne dediğini anlamadım tatlım.", null, function () { });
                        $scope.recognize();
                        return;
                    }

                    var i = 0;
                    var l = res.data.length;
                    $scope.speak((i+1)+' '+res.data[i].Title, i, speak);

                    function speak(j) {
                        j++;
                        if (j == l) {
                            $scope.speak('Başka haber dinlemek istermisin', null, function () {
                                $scope.recognize();
                            });
                            return;
                        }
                        setTimeout(function () {
                            $scope.speak(j+'. haber', j, function(t){
                                setTimeout(function () {
                                    $scope.speak(res.data[t].Title, t, speak)
                                }, 200);
                            })
                        }, 100);
                        
                    }

                });

            }, function errorCallback(err) {
                $scope.text = err;
            }, options);
    }

    $scope.speak = function (text,i,callback) {
        TTS.speak({
            text: text,
            locale: 'tr-TR',
            rate: 1.7
        }, function () {
            if(callback!=null){
                callback(i);
            }
        }, function (reason) { });
    }
}]);

