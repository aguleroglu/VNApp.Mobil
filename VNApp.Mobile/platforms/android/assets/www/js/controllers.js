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
    $ionicPlatform.ready(function () {
        var token = window.localStorage.getItem("LOCAL_TOKEN_KEY");

        if (token != null & token != undefined & token != '') {
            window.location.href = 'index.html';
        }
    });

    $scope.login = function () {
        var email = $scope.username;
        var password = $scope.password;

        $http.post('http://vnapp.herokuapp.com/api/user/signin', { email: email, password: password }).then(function (response) {
            var res = response.data;
            if (res.success == true) {
                window.localStorage.setItem("LOCAL_TOKEN_KEY", res.id);
                var token = window.localStorage.getItem("LOCAL_TOKEN_KEY");
                window.location.href = 'index.html';
            }
            else {
                $scope.Message = res.message;
            }

        });
    }

}]);

VNApp.controller('RegisterController', ['$scope', '$ionicPlatform', '$http', function ($scope, $ionicPlatform, $http) {
    $ionicPlatform.ready(function () {
        var token = window.localStorage.getItem("LOCAL_TOKEN_KEY");

        if (token != null & token != undefined & token != '') {
            window.location.href = 'index.html';
        }
    });

    $scope.register = function () {
        var email = $scope.username;
        var password = $scope.password;

        $http.post('http://vnapp.herokuapp.com/api/user/signup', { email: email, password: password }).then(function (response) {
            var res = response.data;
            if (res.success == true) {
                window.localStorage.setItem("LOCAL_TOKEN_KEY", res.id);
                var token = window.localStorage.getItem("LOCAL_TOKEN_KEY");
                window.location.href = 'index.html';
            }
            else {
                $scope.Message = res.message;
            }

        });
    }

}]);

VNApp.controller('LogOutController', ['$scope', '$ionicPlatform', '$http', function ($scope, $ionicPlatform, $http) {
    $scope.logout = function () {
        window.localStorage.removeItem("LOCAL_TOKEN_KEY");
        window.location.href = 'login.html';
    }
}]);

VNApp.controller('VoiceController', ['$scope', '$ionicPlatform', '$http', function ($scope, $ionicPlatform, $http) {

    $ionicPlatform.ready(function () {
        window.plugins.speechRecognition.requestPermission(function successCallback() { }, function errorCallback() { });
        //$scope.marketing();
    });

    $scope.speak = function (text, successCallBack, errorCallback) {
        TTS.speak({
            text: text,
            locale: 'tr-TR',
            rate: 1.2
        }, function () {
            if (successCallBack != null & successCallBack != undefined) {
                if (typeof successCallBack === 'function') {
                    successCallBack();
                }
                else {
                    eval(successCallBack);
                }
            }
        }, function (reason) {
            if (errorCallback != null & errorCallback != undefined) {
                if (typeof errorCallback === 'function') {
                    errorCallback();
                }
                else {
                    eval(errorCallback);
                }
            }
        });
    }

    $scope.newsData = null;
    $scope.stopRead = false;

    $scope.skip = 0;
    $scope.currentCategory = null;
    $scope.currentLocation = null;

    $scope.order = 0;
    $scope.maxOrder = 0;

    $scope.NewsAvaible = false;
    $scope.NewsTitle = '';
    $scope.NewsImageUrl = '';

    $scope.marketing = function () {
        $scope.marketingIntro();
    }

    $scope.marketingIntro = function () {
        TTS.speak({
            text: "Merhaba ben Viyen. sana istediğin haberlere ulaşmanda yardımcı olmak için buradayım. Benimle ilgili kısa bir video var. izlemek ister misin?",
            locale: 'tr-TR',
            rate: 1.2
        }, function () {
            $scope.recognize($scope.marketingVideo, { type: 'first-interaction' });
        }, function (reason) {
        });
    }

    $scope.marketingVideo = function (response, args) {
        var res = response.data;

        if (res.Intent == "read" | res.Intent == "yes") {
            VideoPlayer.play("file:///android_asset/www/img/Voice%20News.mp4",
                             { scalingMode: VideoPlayer.SCALING_MODE.SCALE_TO_FIT_WITH_CROPPING },
                             $scope.marketingOutro);
        }
        else {
            $scope.marketingOutro();
        }
    }

    $scope.marketingOutro = function () {
        TTS.speak({
            text: "Benden haberleri ya da köşe yazılarını okumamı isteyebilirsin. İstersen kategori veya şehirdeki haberleri filtreleyebilir, istediğin kelimenin geçtiği haberleri arayabilirim. Senin için olumlu, olumsuz ve nötür haberleri de ayrıştırabilirim.",
            locale: 'tr-TR',
            rate: 1.2
        },
        function () { },
        function (reason) { });
    }

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
                        if ($scope.currentCategory != null) { serviceUrl += '&category=' + $scope.currentCategory; }
                        if ($scope.currentLocation != null) { serviceUrl += '&location=' + $scope.currentLocation; }
                        if ($scope.newsData.Type != undefined & $scope.newsData.Type != null) { serviceUrl += '&speechType=' + $scope.newsData.Type; }
                        if ($scope.newsData.Emotion != undefined & $scope.newsData.Emotion != null) { serviceUrl += '&emotion=' + $scope.newsData.Emotion; }
                    }
                }

                console.log(serviceUrl);

                $http.get(serviceUrl).then(function (response) { args != undefined ? successCallback(response, args) : successCallback(response); });

            }, function cantListen(err) {
                $scope.text = err;
            }, options);
    }

    $scope.read = function (order, maxOrder) {
        if (order == maxOrder) {
            $scope.speak('Başka haber dinlemek ister misin?', '$scope.recognize($scope.endOfReadInteraction, { type: "endof-read-interaction" })');
            return;
        }

        setTimeout(function () {
            var data = $scope.newsData.Data[order];

            if (data.ImageUrl == null) {
                $scope.NewsImageUrl = '';
            }
            else {
                $scope.NewsImageUrl = data.ImageUrl;
            }

            $scope.NewsTitle = data.Title;

            $scope.NewsAvaible = true;

            $scope.$apply(function () {
                $scope.order = order;
                $scope.maxOrder = maxOrder;

                $scope.speak((order + 1) + '. haber. ' + data.Description, ('$scope.afterRead({0}, {1})').format(order, maxOrder));
            });
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
            $scope.speak(response.data.Message);
            return false;
        }

        return false;
    }

    $scope.readResponse = function (res) {
        if (res.Category == null) {
            $scope.speak(res.Count + ' tane haber okuyorum.', function () { $scope.readResponseDetail(res) });
        }
        else {
            $scope.speak(res.Count + ' tane ' + res.Category + ' haberi okuyorum.', function () { $scope.readResponseDetail(res) });
        }
    }

    $scope.readResponseDetail = function (res) {
        var order = 0;
        var maxOrder = res.Data.length;

        $scope.read(order, maxOrder);
    }

    $scope.firstInteraction = function (response) {
        if ($scope.responseHasError(response)) {
            return;
        }

        $scope.newsData = response.data;

        $scope.currentCategory = $scope.newsData.Category;
        $scope.currentLocation = $scope.newsData.Location;

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

        args.order++;
        $scope.skip++;

        if (res.Intent == "yes" | res.Intent == "read") {
            $scope.speak($scope.newsData.Data[args.order - 1].Text, ('$scope.read({0}, {1})').format(args.order, args.maxOrder));
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

    $scope.stopSpeak = function () {
        $scope.speak('');
    }

    $scope.nextNews = function () {
        $scope.skip++;
        $scope.read($scope.order + 1, $scope.maxOrder);
    }
}]);
