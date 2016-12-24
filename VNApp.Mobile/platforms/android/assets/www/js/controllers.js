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

    $scope.skip = 0;
    $scope.currentCategory = null;

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
                console.log(JSON.stringify(args));

                $scope.recognized = sentence;

                var serviceUrl = 'http://vnapp.herokuapp.com/api/speech?q=' + sentence;

                if (args != undefined & (args.type != undefined & args.type != null)) {
                    serviceUrl += '&type=' + args.type;

                    if (args.type == 'endof-read-interaction') {
                        serviceUrl += '&skip=' + $scope.skip;
                    }
                }

                $http.get(serviceUrl).then(function (response) { args != undefined ? successCallback(response, args) : successCallback(response); });

            }, function cantListen(err) {
                $scope.text = err;
            }, options);
    }

    $scope.read = function (order, maxOrder) {
        order++; $scope.skip++;

        if (order == maxOrder) {
            $scope.speak('Başka haber dinlemek ister misin?', '$scope.recognize($scope.endOfReadInteraction, { type: "endof-read-interaction" })');
            return;
        }

        setTimeout(function () {
            $scope.speak((order + 1) + '. haber. ' + $scope.newsData.Data[order].Description, ('$scope.afterRead({0}, {1})').format(order, maxOrder));
        }, 300);

    }

    $scope.responseHasError = function (response) {
        if (response.data.Error & response.data.Message == null) {
            $scope.speak('Bir hata oluştu!');
            return true;
        }

        if (response.data.Error & response.data.Message != null) {
            $scope.speak(response.data.Message);
            return true;
        }

        if (response.data.Message != null) {
            return $scope.speak(response.data.Message, function () { return false; });
        }

        return false;
    }

    $scope.readResponse = function (res) {
        if (res.Category == null) {
            $scope.speak(res.Count + ' tane haber okuyorum.');
        }
        else {
            $scope.speak(res.Count + ' tane ' + res.Category + ' haberi okuyorum.');
        }

        var order = 0;
        var maxOrder = res.Data.length;
        $scope.speak((order + 1) + '. haber. ' + res.Data[order].Description, ('$scope.afterRead({0}, {1})').format(order, maxOrder));
    }

    $scope.firstInteraction = function (response) {
        if ($scope.responseHasError(response)) {
            return;
        }

        $scope.newsData = response.data;

        $scope.currentCategory = $scope.newsData.Category;

        var res = $scope.newsData;
        console.log(JSON.stringify(res));

        if (res.Intent == "read" | res.Intent == "search" | res.Intent == "yes") {
            $scope.readResponse(res);
        }
        else if (res.Intent == "stop" | res.Intent == "no") {
            $scope.speak('Peki.');
        }
        else {
            $scope.speak('Ne dediğini anlamadım tatlım.', '$scope.recognize($scope.firstInteraction, { type: "first-interaction" })');
            return;
        }
    }

    $scope.endOfReadInteraction = function (response, args) {
        if ($scope.responseHasError(response)) {
            return;
        }

        $scope.newsData = response.data;

        var sameCategory = $scope.currentCategory == $scope.newsData.Category;

        var res = $scope.newsData;
        console.log(JSON.stringify(res));
        
        if (res.Intent == "read" | res.Intent == "search" | res.Intent == "yes") {
            if (!sameCategory) {
                $scope.currentCategory = $scope.newsData.Category;
                $scope.skip = 0;
            }

            $scope.readResponse(res);
        }
        else if (res.Intent == "stop" | res.Intent == "no") {
            $scope.speak('Peki.');
        }
        else {
            $scope.speak('Ne dediğini anlamadım tatlım.', '$scope.recognize($scope.endOfReadInteraction, { type: "endof-read-interaction" })');
            return;
        }
    }

    $scope.detailInteraction = function (response, args) {
        if ($scope.responseHasError(response)) {
            return;
        }

        var res = response.data;

        console.log(JSON.stringify(res));

        if (res.Intent == "yes" | res.Intent == "read") {
            $scope.speak($scope.newsData.Data[args.order].Text, ('$scope.read({0}, {1})').format(args.order, args.maxOrder));
        }
        else if (res.Intent == "stop") {
            $scope.speak('Peki.');
        }
        else {
            $scope.read(args.order, args.maxOrder);
        }
    }

    $scope.afterRead = function (order, maxOrder) {
        $scope.speak('Detayını dinlemek ister misin?', ('$scope.recognize($scope.detailInteraction, { type: "after-read-interaction", order: {0}, maxOrder: {1} })').format(order, maxOrder));
    }
}]);
