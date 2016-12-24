String.prototype.format = function () {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

var VNApp = angular.module('VNApp', ['ionic', 'ngCordova'])
.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        if (cordova.platformId === "ios" && window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }

        window.plugins.insomnia.keepAwake();
    });
})

VNApp.controller('LoginController', ['$scope', '$ionicPlatform', '$http', function ($scope, $ionicPlatform, $http) {

}]);

VNApp.controller('VoiceController', ['$scope', '$ionicPlatform', '$http', function ($scope, $ionicPlatform, $http) {

    $ionicPlatform.ready(function () {
        window.plugins.speechRecognition.requestPermission(function successCallback() { }, function errorCallback() { });
    });

    $scope.speak = function (text, successCallBack, errorCallback) {
        TTS.speak({
            text: text,
            locale: 'tr-TR',
            rate: 1.2
        }, function () {
            if (successCallBack != null & successCallBack != undefined) {
                eval(successCallBack);
            }
        }, function (reason) {
            if (errorCallback != null & errorCallback != undefined) {
                eval(errorCallback);
            }
        });
    }

    $scope.newsData = null;
    $scope.stopRead = false;

    $scope.recognize = function (successCallback, args) {
        let options = {
            language: "tr-TR",
            matches: 1,
            prompt: "Sizi dinliyorum :)",
            showPopup: true,
            showPartial: true
        }

        window.plugins.speechRecognition.startListening(
            function canListen(items) {
                $scope.recognized = "";

                var sentence = items[0];
                console.log(sentence);

                $scope.recognized = sentence;

                $http.get('http://vnapp.herokuapp.com/api/speech?q=' + sentence).then(function (response) { args != undefined ? successCallback(response, args) : successCallback(response); });

            }, function cantListen(err) {
                $scope.text = err;
            }, options);
    }

    $scope.read = function (order, maxOrder) {
        order++;

        if (order == maxOrder) {
            $scope.speak('Başka haber dinlemek ister misin?', '$scope.recognize($scope.nextInteraction)');
            return;
        }

        setTimeout(function () {
            $scope.speak((order + 1) + '. haber. ' + $scope.newsData.data[order].Title, ('$scope.afterRead({0}, {1})').format(order, maxOrder));
        }, 300);

    }

    $scope.firstInteraction = function (response) {
        $scope.newsData = response.data;

        var res = $scope.newsData;
        console.log(JSON.stringify(res));

        if (res.Intent != "read") {
            $scope.speak('Ne dediğini anlamadım tatlım.', '$scope.recognize($scope.firstInteraction)');
            return;
        }

        if (res.Category == null) {
            $scope.speak(res.Count + ' tane haber okuyorum.');
        }
        else {
            $scope.speak(res.Count + ' tane ' + res.Category + ' haberi okuyorum.');
        }

        var order = 0;
        var maxOrder = res.data.length;
        $scope.speak((order + 1) + '. haber. ' + res.data[order].Title, ('$scope.afterRead({0}, {1})').format(order, maxOrder));
    }

    $scope.nextInteraction = function (response) {
        $scope.firstInteraction(response);
    }

    $scope.detailInteraction = function (response, args) {
        var res = response.data;
        console.log(JSON.stringify(res));

        if (res.Intent == "yes") {
            $scope.speak('Sana bu haberin detayını okuyamam bebişim.', ('$scope.read({0}, {1})').format(args.order, args.maxOrder));
        }
        else if (res.Intent == "stop") {
            $scope.speak('Peki.');
        }
        else {
            $scope.read(args.order, args.maxOrder);
        }
    }

    $scope.afterRead = function (order, maxOrder) {
        $scope.speak('Detayını dinlemek ister misin?', ('$scope.recognize($scope.detailInteraction, { order: {0}, maxOrder: {1} })').format(order, maxOrder));
    }
}]);
